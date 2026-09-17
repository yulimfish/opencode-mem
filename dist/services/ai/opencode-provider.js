/**
 * Structured output via the opencode HTTP server.
 *
 * Replaces the older auth.json/OAuth-juggling flow. Instead of forging
 * requests to provider HTTP endpoints ourselves, we delegate to the
 * running opencode server: it already owns the user's auth (any provider,
 * including github-copilot personal/business), token refresh, and provider
 * routing.
 *
 * Per call we create a transient session, prompt it with a JSON schema,
 * then delete the session so it does not pollute the user's TUI session
 * list.
 *
 * Internal capture sessions are least-privilege (issue #189): ordinary
 * agent tools are denied, only StructuredOutput is allowed, a dedicated
 * agent caps steps, and a hard timeout fails closed.
 *
 * The primary transport is the authenticated v2 SDK client initialized from
 * the plugin host's client configuration. A raw fetch fallback remains for
 * older SDK builds that do not expose the v2 session methods.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { diagnosticUrl, readJson, responseStatus, } from "./opencode-diagnostics.js";
import { INTERNAL_CAPTURE_SESSION_TITLE, trackInternalCaptureSession, untrackInternalCaptureSession, } from "./internal-capture-sessions.js";
import { createLazyV2Client } from "./opencode-sdk-client.js";
/** Dedicated agent registered via the plugin config hook (step-capped). */
export const STRUCTURED_OUTPUT_AGENT = "opencode-mem-structured";
/** Hard ceiling for a single internal structured-output prompt. */
export const STRUCTURED_OUTPUT_TIMEOUT_MS = 90_000;
let _structuredOutputTimeoutMs = STRUCTURED_OUTPUT_TIMEOUT_MS;
/** Test helper: override the structured-output prompt timeout. Pass undefined to reset. */
export function setStructuredOutputTimeoutMsForTests(ms) {
    _structuredOutputTimeoutMs = ms ?? STRUCTURED_OUTPUT_TIMEOUT_MS;
}
export const STRUCTURED_OUTPUT_PERMISSIONS = [
    { permission: "*", pattern: "*", action: "deny" },
    { permission: "StructuredOutput", pattern: "*", action: "allow" },
];
export const STRUCTURED_OUTPUT_TOOLS = {
    "*": false,
    StructuredOutput: true,
};
export const STRUCTURED_OUTPUT_METADATA = {
    "opencode-mem": {
        internal: true,
        purpose: "structured-output",
    },
};
const _internalSessions = new Set();
let _connectedProviders = new Set();
let _v2Client;
let _v2BaseUrl;
let _hostFetch;
let _useSdkTransport = false;
export function setHostFetch(customFetch) {
    _hostFetch = customFetch;
}
export function resetHostFetch() {
    _hostFetch = undefined;
}
export function setConnectedProviders(providers) {
    _connectedProviders = new Set(providers);
}
export function isProviderConnected(providerName) {
    return _connectedProviders.has(providerName);
}
export function setV2Client(client) {
    _v2Client = client;
}
export function getV2Client() {
    return _v2Client;
}
export function createV2Client(serverUrl, transport) {
    const baseUrl = typeof serverUrl === "string" ? serverUrl : serverUrl.toString();
    const activeTransport = transport ?? (_hostFetch ? { fetch: _hostFetch } : undefined);
    _v2BaseUrl = baseUrl;
    _useSdkTransport = Boolean(activeTransport?.fetch || activeTransport?.headers);
    return createLazyV2Client(baseUrl, activeTransport);
}
/** True while an internal structured-output session is live (create → delete). */
export function isInternalStructuredSession(sessionID) {
    return _internalSessions.has(sessionID);
}
/** Test helper: clear tracked internal session IDs. */
export function resetInternalStructuredSessions() {
    _internalSessions.clear();
}
function markInternalSession(sessionID) {
    _internalSessions.add(sessionID);
}
function unmarkInternalSession(sessionID) {
    _internalSessions.delete(sessionID);
}
function sessionCreateBody() {
    return {
        title: INTERNAL_CAPTURE_SESSION_TITLE,
        permission: STRUCTURED_OUTPUT_PERMISSIONS,
        metadata: STRUCTURED_OUTPUT_METADATA,
    };
}
function sessionPromptFields(args) {
    return {
        model: { providerID: args.providerID, modelID: args.modelID },
        agent: STRUCTURED_OUTPUT_AGENT,
        system: args.systemPrompt,
        parts: [{ type: "text", text: args.userPrompt }],
        tools: STRUCTURED_OUTPUT_TOOLS,
        // `noReply` suppresses assistant generation in current OpenCode builds,
        // which also suppresses `info.structured_output`; structured capture needs
        // the assistant run even though the temporary session is deleted afterward.
        format: {
            type: "json_schema",
            schema: args.jsonSchema,
            ...(args.retryCount !== undefined ? { retryCount: args.retryCount } : {}),
        },
    };
}
/**
 * Resolve `opencodeModel: "inherit"` to a concrete provider/model.
 *
 * Prefer an explicit prompt-recorded model (auto-capture path). Otherwise fall
 * back to OpenCode's recent model list so profile-learning / conflict / dedup
 * paths don't send the literal model id "inherit" (ProviderModelNotFoundError).
 */
export function resolveOpencodeModelRef(opts) {
    if (opts.modelID !== "inherit") {
        return { providerID: opts.providerID, modelID: opts.modelID };
    }
    if (opts.prompt?.providerId && opts.prompt?.modelId) {
        return { providerID: opts.prompt.providerId, modelID: opts.prompt.modelId };
    }
    const recent = readRecentOpencodeModel(opts.providerID);
    if (recent)
        return recent;
    throw new Error("opencode-mem: opencodeModel is 'inherit' but no session model was recorded and no recent OpenCode model is available");
}
function readRecentOpencodeModel(preferredProvider) {
    try {
        // OpenCode state path mirrors `opencode debug paths` → state.
        const stateDir = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
        const modelPath = join(stateDir, "opencode", "model.json");
        if (!existsSync(modelPath))
            return undefined;
        const raw = JSON.parse(readFileSync(modelPath, "utf8"));
        const recent = Array.isArray(raw.recent) ? raw.recent : [];
        const match = (preferredProvider
            ? recent.find((r) => r.providerID === preferredProvider && r.modelID)
            : undefined) ?? recent.find((r) => r.providerID && r.modelID);
        if (!match?.providerID || !match.modelID)
            return undefined;
        return { providerID: match.providerID, modelID: match.modelID };
    }
    catch {
        return undefined;
    }
}
/**
 * Generate one structured-output completion via opencode's HTTP API.
 * Throws on: session.create failure, prompt failure, AssistantMessage.error
 * (StructuredOutputError / ApiError / ...), missing `info.structured`,
 * timeout, or final Zod validation failure.
 */
export async function generateStructuredOutput(opts) {
    const resolved = resolveOpencodeModelRef({
        providerID: opts.providerID,
        modelID: opts.modelID,
    });
    const { client, systemPrompt, userPrompt, schema, directory, retryCount } = opts;
    const { providerID, modelID } = resolved;
    const jsonSchema = schema.toJSONSchema?.() ?? (await import("zod")).z.toJSONSchema(schema);
    if (_useSdkTransport && hasV2SessionClient(client)) {
        return generateViaSdkClient(client, {
            providerID,
            modelID,
            systemPrompt,
            userPrompt,
            directory,
            retryCount,
            jsonSchema,
            schema,
        });
    }
    const baseUrl = _v2BaseUrl;
    if (!baseUrl) {
        throw new Error("opencode-mem: v2 server base URL not initialized; call createV2Client(serverUrl) first");
    }
    const base = stripTrailingSlash(baseUrl);
    const sessionID = await createSession(base, directory);
    markInternalSession(sessionID);
    try {
        const info = await withStructuredOutputTimeout(() => promptSession(base, {
            sessionID,
            directory,
            providerID,
            modelID,
            systemPrompt,
            userPrompt,
            jsonSchema,
            retryCount,
        }), () => abortSession(base, sessionID, directory));
        if (info.error) {
            throw new Error(`opencode-mem: opencode reported ${info.error.name}: ${formatAssistantError(info.error)}`);
        }
        const structuredOutput = info.structured_output ?? info.structured;
        if (structuredOutput === undefined || structuredOutput === null) {
            throw new Error("opencode-mem: opencode returned no structured output (info.structured_output/info.structured were empty)");
        }
        return schema.parse(structuredOutput);
    }
    finally {
        unmarkInternalSession(sessionID);
        // Best-effort: leaving a transient session behind is cosmetic, not
        // worth failing a successful capture if cleanup itself errors.
        try {
            await deleteSession(base, sessionID, directory);
        }
        catch {
            // intentionally swallowed
        }
        finally {
            untrackInternalCaptureSession(sessionID);
        }
    }
}
function hasV2SessionClient(client) {
    const session = client.session;
    if (typeof session !== "object" || session === null)
        return false;
    const candidate = session;
    return (typeof candidate.create === "function" &&
        typeof candidate.prompt === "function" &&
        typeof candidate.delete === "function");
}
async function generateViaSdkClient(client, args) {
    const createdResponse = await client.session.create({
        ...sessionCreateBody(),
        ...(args.directory ? { directory: args.directory } : {}),
    });
    const created = readSdkData(createdResponse, "POST /session");
    if (!created.id) {
        throw new Error("opencode-mem: session.create returned no session id; cannot generate structured output");
    }
    const sessionID = created.id;
    trackInternalCaptureSession(sessionID);
    markInternalSession(sessionID);
    try {
        const promptResponse = await withStructuredOutputTimeout(() => client.session.prompt({
            sessionID,
            ...(args.directory ? { directory: args.directory } : {}),
            ...sessionPromptFields(args),
        }), () => client.session.abort?.({
            sessionID,
            ...(args.directory ? { directory: args.directory } : {}),
        }));
        const data = readSdkData(promptResponse, "POST /session/{id}/message");
        if (!data.info) {
            throw new Error("opencode-mem: prompt response missing `info`");
        }
        if (data.info.error) {
            throw new Error(`opencode-mem: opencode reported ${data.info.error.name}: ${formatAssistantError(data.info.error)}`);
        }
        const structuredOutput = data.info.structured_output ?? data.info.structured;
        if (structuredOutput === undefined || structuredOutput === null) {
            throw new Error("opencode-mem: opencode returned no structured output (info.structured_output/info.structured were empty)");
        }
        return args.schema.parse(structuredOutput);
    }
    finally {
        unmarkInternalSession(sessionID);
        try {
            await client.session.delete({
                sessionID,
                ...(args.directory ? { directory: args.directory } : {}),
            });
        }
        catch {
            // Best-effort cleanup for the transient capture session.
        }
        finally {
            untrackInternalCaptureSession(sessionID);
        }
    }
}
async function withStructuredOutputTimeout(run, onTimeout) {
    let timer;
    const timeoutMs = _structuredOutputTimeoutMs;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`opencode-mem: structured-output timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    try {
        return await Promise.race([run(), timeoutPromise]);
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("structured-output timed out after")) {
            try {
                await onTimeout();
            }
            catch {
                // best-effort abort
            }
        }
        throw error;
    }
    finally {
        if (timer !== undefined)
            clearTimeout(timer);
    }
}
function readSdkData(response, label) {
    const result = response;
    if (result?.error !== undefined) {
        const status = result.response ? ` (${responseStatus(result.response)})` : "";
        const responseUrl = result.response?.url || result.request?.url;
        const url = responseUrl ? diagnosticUrl(responseUrl) : "the authenticated client";
        throw new Error(`opencode-mem: opencode ${label} failed at ${url}${status}: <redacted response body>`);
    }
    if (result?.data === undefined) {
        throw new Error(`opencode-mem: opencode ${label} returned no response data`);
    }
    return result.data;
}
function stripTrailingSlash(url) {
    return url.endsWith("/") ? url.slice(0, -1) : url;
}
function buildQuery(directory) {
    if (!directory)
        return "";
    return `?directory=${encodeURIComponent(directory)}`;
}
async function fetchJson(endpoint, init) {
    let res;
    try {
        res = await activeFetch()(new Request(endpoint.url, init));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`opencode-mem: failed to fetch ${endpoint.label} at ${diagnosticUrl(endpoint.url)}: ${message}`);
    }
    return readJson(res, endpoint);
}
async function createSession(base, directory) {
    const url = `${base}/session${buildQuery(directory)}`;
    const body = await fetchJson({ label: "POST /session", url }, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionCreateBody()),
    });
    if (!body.id) {
        throw new Error("opencode-mem: session.create returned no session id; cannot generate structured output");
    }
    trackInternalCaptureSession(body.id);
    return body.id;
}
function formatAssistantError(error) {
    if (!error.data)
        return error.name;
    const details = safeAssistantErrorDetails(error.data);
    if (!error.data.message)
        return details;
    return details ? `${error.data.message}; ${details}` : error.data.message;
}
function safeAssistantErrorDetails(data) {
    const safeFields = {};
    for (const key of ["statusCode", "providerID", "modelID"]) {
        const value = data[key];
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            safeFields[key] = value;
        }
    }
    const entries = Object.entries(safeFields);
    if (entries.length === 0)
        return "";
    return `details=${JSON.stringify(Object.fromEntries(entries))}`;
}
async function promptSession(base, args) {
    const url = `${base}/session/${encodeURIComponent(args.sessionID)}/message${buildQuery(args.directory)}`;
    const body = sessionPromptFields(args);
    const data = await fetchJson({ label: "POST /session/{id}/message", url }, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!data.info) {
        throw new Error("opencode-mem: prompt response missing `info`");
    }
    return data.info;
}
async function abortSession(base, sessionID, directory) {
    const url = `${base}/session/${encodeURIComponent(sessionID)}/abort${buildQuery(directory)}`;
    try {
        await activeFetch()(new Request(url, { method: "POST" }));
    }
    catch {
        // best-effort
    }
}
async function deleteSession(base, sessionID, directory) {
    const url = `${base}/session/${encodeURIComponent(sessionID)}${buildQuery(directory)}`;
    let res;
    try {
        res = await activeFetch()(new Request(url, { method: "DELETE" }));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`opencode-mem: failed to fetch DELETE /session/{id} at ${diagnosticUrl(url)}: ${message}`);
    }
    // DELETE /session/:id returns boolean. We only care that it ran; failures
    // are swallowed at the call site.
    if (!res.ok) {
        throw new Error(`opencode-mem: opencode DELETE /session/{id} failed at ${diagnosticUrl(url)} (${responseStatus(res)})`);
    }
}
function activeFetch() {
    return _hostFetch ?? globalThis.fetch;
}
