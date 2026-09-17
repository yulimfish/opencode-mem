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
import type { z } from "zod";
import type { OpencodeClient } from "@opencode-ai/sdk/v2/client";
import { type HostTransport } from "./opencode-sdk-client.js";
/** Dedicated agent registered via the plugin config hook (step-capped). */
export declare const STRUCTURED_OUTPUT_AGENT = "opencode-mem-structured";
/** Hard ceiling for a single internal structured-output prompt. */
export declare const STRUCTURED_OUTPUT_TIMEOUT_MS = 90000;
/** Test helper: override the structured-output prompt timeout. Pass undefined to reset. */
export declare function setStructuredOutputTimeoutMsForTests(ms: number | undefined): void;
export declare const STRUCTURED_OUTPUT_PERMISSIONS: ({
    permission: string;
    pattern: string;
    action: "deny";
} | {
    permission: string;
    pattern: string;
    action: "allow";
})[];
export declare const STRUCTURED_OUTPUT_TOOLS: Record<string, boolean>;
export declare const STRUCTURED_OUTPUT_METADATA: {
    "opencode-mem": {
        internal: boolean;
        purpose: string;
    };
};
export declare function setHostFetch(customFetch: typeof fetch): void;
export declare function resetHostFetch(): void;
export declare function setConnectedProviders(providers: string[]): void;
export declare function isProviderConnected(providerName: string): boolean;
export declare function setV2Client(client: OpencodeClient): void;
export declare function getV2Client(): OpencodeClient | undefined;
export declare function createV2Client(serverUrl: URL | string, transport?: HostTransport): OpencodeClient;
/** True while an internal structured-output session is live (create → delete). */
export declare function isInternalStructuredSession(sessionID: string): boolean;
/** Test helper: clear tracked internal session IDs. */
export declare function resetInternalStructuredSessions(): void;
export interface StructuredOutputOptions<T> {
    client: OpencodeClient;
    providerID: string;
    modelID: string;
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodType<T>;
    directory?: string;
    retryCount?: number;
}
/**
 * Resolve `opencodeModel: "inherit"` to a concrete provider/model.
 *
 * Prefer an explicit prompt-recorded model (auto-capture path). Otherwise fall
 * back to OpenCode's recent model list so profile-learning / conflict / dedup
 * paths don't send the literal model id "inherit" (ProviderModelNotFoundError).
 */
export declare function resolveOpencodeModelRef(opts: {
    providerID: string;
    modelID: string;
    prompt?: {
        providerId?: string | null;
        modelId?: string | null;
    };
}): {
    providerID: string;
    modelID: string;
};
/**
 * Generate one structured-output completion via opencode's HTTP API.
 * Throws on: session.create failure, prompt failure, AssistantMessage.error
 * (StructuredOutputError / ApiError / ...), missing `info.structured`,
 * timeout, or final Zod validation failure.
 */
export declare function generateStructuredOutput<T>(opts: StructuredOutputOptions<T>): Promise<T>;
//# sourceMappingURL=opencode-provider.d.ts.map