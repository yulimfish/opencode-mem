export type EmbeddingTask = "document" | "query";
export type EmbedOptions = {
    task?: EmbeddingTask;
};
/**
 * Apply Nomic-style task prefixes when enabled.
 * Cache keys and API/local inputs should use the returned string.
 */
export declare function applyEmbeddingTaskPrefix(text: string, options?: EmbedOptions, useTaskPrefixes?: boolean): string;
type HfTransformers = typeof import("@huggingface/transformers");
declare let _transformers: {
    pipeline: HfTransformers["pipeline"];
    env: HfTransformers["env"];
} | null;
/**
 * Production transformers load path used by nested OpenCode install fixtures (#210).
 * Prefer this over a separately anchored createRequire() so empty-referrer hosts are covered.
 */
export declare function loadLocalTransformersBackend(): Promise<NonNullable<typeof _transformers>>;
export declare class EmbeddingService {
    private pipe;
    private initPromise;
    isWarmedUp: boolean;
    /** Set when warmup fails permanently; prevents "initializing forever" (#184). */
    initError: string | null;
    private cache;
    private cachedModelName;
    static getInstance(): EmbeddingService;
    warmup(progressCallback?: (progress: any) => void): Promise<void>;
    private initializeModel;
    embed(text: string, options?: EmbedOptions): Promise<Float32Array>;
    embedWithTimeout(text: string, options?: EmbedOptions): Promise<Float32Array>;
    clearCache(): void;
}
export declare const embeddingService: EmbeddingService;
export {};
//# sourceMappingURL=embedding.d.ts.map