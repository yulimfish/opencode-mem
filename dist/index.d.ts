import type { Plugin } from "@opencode-ai/plugin";
import { INTERNAL_CAPTURE_SESSION_TITLE, isInternalCaptureSessionTitle } from "./services/ai/internal-capture-sessions.js";
export { INTERNAL_CAPTURE_SESSION_TITLE, isInternalCaptureSessionTitle };
export declare function isStructuredSummaryPromptMessage(userMessage: string): boolean;
/**
 * Resolve the session's active agent so compaction memory injection does not
 * reset OpenCode to the stock "general-purpose" fallback (issue #236).
 *
 * Preference order:
 * 1. session.get().agent (v2 hosts)
 * 2. Latest non-compaction user message agent
 * 3. Latest non-compaction / non-summary assistant mode (v1) or agent (v2)
 */
export declare function resolveSessionAgent(client: unknown, sessionID: string): Promise<string | undefined>;
/** Least-privilege agent used only by internal structured-output sessions (issue #189). */
export declare function applyStructuredOutputAgentConfig(cfg: {
    agent?: Record<string, unknown>;
}): void;
export declare function configureOpencodeHostTransport(ctx: {
    readonly client: unknown;
    readonly serverUrl?: string | URL;
}): Promise<void>;
export declare const OpenCodeMemPlugin: Plugin;
//# sourceMappingURL=index.d.ts.map