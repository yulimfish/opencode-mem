import { CONFIG } from "../config.js";
import { log } from "./logger.js";
import { join } from "node:path";
import { formatOnnxruntimeInitError, prepareOnnxruntimeForTransformers, } from "./onnxruntime-resolve.js";
import { createRuntimeRequire } from "./runtime-require.js";
const requireFromHere = createRuntimeRequire(import.meta);
const TIMEOUT_MS = 30000;
const GLOBAL_EMBEDDING_KEY = Symbol.for("opencode-mem.embedding.instance");
const MAX_CACHE_SIZE = 100;
const TASK_PREFIXES = {
    document: "search_document: ",
    query: "search_query: ",
};
/**
 * Apply Nomic-style task prefixes when enabled.
 * Cache keys and API/local inputs should use the returned string.
 */
export function applyEmbeddingTaskPrefix(text, options, useTaskPrefixes = CONFIG.embeddingUseTaskPrefixes) {
    if (!useTaskPrefixes || !options?.task)
        return text;
    const prefix = TASK_PREFIXES[options.task];
    if (text.startsWith(prefix))
        return text;
    return `${prefix}${text}`;
}
let _transformers = null;
function getTransformersPackageSpecifier() {
    // Keep this non-literal so OpenCode/Bun plugin-loader bundling does not eagerly
    // traverse @huggingface/transformers internals during plugin startup. The package
    // is only needed for the local embedding backend, and should stay lazy.
    return ["@huggingface", "transformers"].join("/");
}
async function ensureTransformersLoaded() {
    if (_transformers !== null)
        return _transformers;
    // Pin onnxruntime-node (+ common) to our direct 1.20.1 stack before transformers
    // resolves them (#184 / #210 / #225). Load the CJS export so Module._resolveFilename
    // shim applies — the ESM entry's static import bypasses it under OpenCode nested installs.
    //
    // Critical ordering for OpenCode's Bun --compile host (#210 follow-up):
    // resolve the transformers absolute path BEFORE installOnnxruntimeResolveShim().
    // After the shim is installed, non-onnx Module._resolveFilename fallbacks fail with
    // `Cannot find module '@huggingface/transformers' from ''` even though the package
    // exists. Loading via the pre-resolved absolute path keeps the onnx pin shim active
    // for transformers' nested requires without needing a post-shim package resolve.
    const transformersSpecifier = getTransformersPackageSpecifier();
    let transformersEntry;
    try {
        transformersEntry = requireFromHere.resolve(transformersSpecifier);
    }
    catch (error) {
        throw new Error(`Cannot resolve ${transformersSpecifier} before installing the onnxruntime pin shim. ` +
            `Original error: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
    prepareOnnxruntimeForTransformers();
    const mod = requireFromHere(transformersEntry);
    mod.env.allowLocalModels = true;
    mod.env.allowRemoteModels = true;
    mod.env.cacheDir = join(CONFIG.storagePath, ".cache");
    // Keep ONNX WASM single-threaded for Bun/Node runtimes without SharedArrayBuffer.
    try {
        mod.env.backends.onnx.wasm.numThreads = 1;
    }
    catch (e) {
        log("Failed to set wasm.numThreads", { error: String(e) });
    }
    _transformers = mod;
    return _transformers;
}
/**
 * Production transformers load path used by nested OpenCode install fixtures (#210).
 * Prefer this over a separately anchored createRequire() so empty-referrer hosts are covered.
 */
export async function loadLocalTransformersBackend() {
    return ensureTransformersLoaded();
}
function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
    ]);
}
export class EmbeddingService {
    pipe = null;
    initPromise = null;
    isWarmedUp = false;
    /** Set when warmup fails permanently; prevents "initializing forever" (#184). */
    initError = null;
    cache = new Map();
    cachedModelName = null;
    static getInstance() {
        if (!globalThis[GLOBAL_EMBEDDING_KEY]) {
            globalThis[GLOBAL_EMBEDDING_KEY] = new EmbeddingService();
        }
        return globalThis[GLOBAL_EMBEDDING_KEY];
    }
    async warmup(progressCallback) {
        if (this.isWarmedUp)
            return;
        if (this.initError)
            throw new Error(this.initError);
        if (this.initPromise)
            return this.initPromise;
        this.initPromise = this.initializeModel(progressCallback);
        return this.initPromise;
    }
    async initializeModel(progressCallback) {
        try {
            if (CONFIG.embeddingApiUrl && CONFIG.embeddingApiKey) {
                // Send a probe request to verify the API endpoint is actually reachable
                // Uses a minimal embedding of "ping" to test the full request pipeline
                const probeResponse = await withTimeout(fetch(`${CONFIG.embeddingApiUrl}/embeddings`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${CONFIG.embeddingApiKey}`,
                    },
                    body: JSON.stringify({
                        input: "ping",
                        model: CONFIG.embeddingModel,
                    }),
                }), TIMEOUT_MS);
                if (!probeResponse.ok) {
                    throw new Error(`Embedding API health check failed: ${probeResponse.status} ${probeResponse.statusText}`);
                }
                this.isWarmedUp = true;
                this.initError = null;
                return;
            }
            // Local model path
            const { pipeline } = await ensureTransformersLoaded();
            this.pipe = await pipeline("feature-extraction", CONFIG.embeddingModel, {
                progress_callback: progressCallback,
            });
            this.isWarmedUp = true;
            this.initError = null;
            log("Embedding model warmed up", { model: CONFIG.embeddingModel });
        }
        catch (error) {
            const rewritten = formatOnnxruntimeInitError(error);
            this.initPromise = null;
            this.initError = rewritten.message;
            log("Failed to initialize embedding model", { error: rewritten.message });
            throw rewritten;
        }
    }
    async embed(text, options) {
        if (this.cachedModelName !== CONFIG.embeddingModel) {
            this.clearCache();
            this.cachedModelName = CONFIG.embeddingModel;
        }
        const input = applyEmbeddingTaskPrefix(text, options);
        const cached = this.cache.get(input);
        if (cached)
            return cached;
        if (!this.isWarmedUp && !this.initPromise) {
            await this.warmup();
        }
        if (this.initPromise) {
            await this.initPromise;
        }
        let result;
        if (CONFIG.embeddingApiUrl && CONFIG.embeddingApiKey) {
            const response = await fetch(`${CONFIG.embeddingApiUrl}/embeddings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${CONFIG.embeddingApiKey}`,
                },
                body: JSON.stringify({
                    input,
                    model: CONFIG.embeddingModel,
                }),
            });
            if (!response.ok) {
                throw new Error(`API embedding failed: ${response.statusText}`);
            }
            const data = await response.json();
            result = new Float32Array(data.data[0].embedding);
        }
        else {
            const output = await this.pipe(input, { pooling: "mean", normalize: true });
            result = new Float32Array(output.data);
        }
        if (this.cache.size >= MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined)
                this.cache.delete(firstKey);
        }
        this.cache.set(input, result);
        return result;
    }
    async embedWithTimeout(text, options) {
        return withTimeout(this.embed(text, options), TIMEOUT_MS);
    }
    clearCache() {
        this.cache.clear();
    }
}
export const embeddingService = EmbeddingService.getInstance();
