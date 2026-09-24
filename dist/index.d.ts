/**
 * Minimal context contract the legacy plugin implementation relies on. The V2
 * registration layer (src/v2-register.ts) builds this from the V2 plugin
 * context; the V1 host provided the same shape via PluginInput.
 */
export interface PluginInput {
    readonly directory: string;
    /**
     * V1 SDK client. The V2 registration layer (src/v2-register.ts) provides a
     * structurally-compatible adapter; typed as `any` to match the loose calls
     * the legacy implementation already makes.
     */
    readonly client: any;
    readonly serverUrl?: string | URL;
}
import type { MemoryType } from "./types/index.js";
import type { MemoryScope } from "./services/client.js";
import { INTERNAL_CAPTURE_SESSION_TITLE, isInternalCaptureSessionTitle } from "./services/ai/internal-capture-sessions.js";
export { INTERNAL_CAPTURE_SESSION_TITLE, isInternalCaptureSessionTitle };
/** JSON Schema for the memory tool input (V2 ToolEditor.add input). */
export declare const MEMORY_TOOL_INPUT: {
    readonly type: "object";
    readonly properties: {
        readonly mode: {
            readonly type: "string";
            readonly enum: readonly ["add", "search", "profile", "list", "forget", "help", "migrate", "list-shards", "export", "import"];
            readonly description: "Operation: add | search | profile | list | forget | help | migrate | list-shards | export | import";
        };
        readonly content: {
            readonly type: "string";
            readonly description: "Memory content (add) or preference text (profile write)";
        };
        readonly query: {
            readonly type: "string";
            readonly description: "Search query (search) — technical keywords/tags rank highest";
        };
        readonly tags: {
            readonly type: "string";
            readonly description: "Comma-separated tags (add)";
        };
        readonly type: {
            readonly type: "string";
            readonly description: "Memory type (add)";
        };
        readonly memoryId: {
            readonly type: "string";
            readonly description: "Memory id (forget)";
        };
        readonly limit: {
            readonly type: "number";
            readonly description: "Result limit (list/search)";
        };
        readonly scope: {
            readonly type: "string";
            readonly enum: readonly ["project", "all-projects"];
            readonly description: "Search/list scope";
        };
        readonly fromPath: {
            readonly type: "string";
            readonly description: "Orphaned project path (migrate)";
        };
        readonly fromHash: {
            readonly type: "string";
            readonly description: "Orphaned project hash (migrate)";
        };
        readonly outputPath: {
            readonly type: "string";
            readonly description: "Export target JSON file (export)";
        };
        readonly inputPath: {
            readonly type: "string";
            readonly description: "Import source JSON file (import)";
        };
        readonly dryRun: {
            readonly type: "boolean";
            readonly description: "Preview without applying (migrate/import)";
        };
        readonly allowLinkedSource: {
            readonly type: "boolean";
            readonly description: "Allow migrating from a linked source path (migrate)";
        };
    };
    readonly additionalProperties: false;
};
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
export declare const OpenCodeMemPlugin: (ctx: PluginInput) => Promise<{
    config: (cfg: {
        agent?: Record<string, unknown>;
    }) => Promise<void>;
    "chat.message": (input: {
        sessionID: string;
    }, output: {
        parts: any[];
        message: {
            id: string;
        };
    }) => Promise<void>;
    "chat.params": (input: {
        message: {
            id: string;
        };
        model: {
            providerID: string;
            id: string;
        };
    }) => Promise<void>;
    tool: {
        memory: {
            description: string;
            args: {
                readonly type: "object";
                readonly properties: {
                    readonly mode: {
                        readonly type: "string";
                        readonly enum: readonly ["add", "search", "profile", "list", "forget", "help", "migrate", "list-shards", "export", "import"];
                        readonly description: "Operation: add | search | profile | list | forget | help | migrate | list-shards | export | import";
                    };
                    readonly content: {
                        readonly type: "string";
                        readonly description: "Memory content (add) or preference text (profile write)";
                    };
                    readonly query: {
                        readonly type: "string";
                        readonly description: "Search query (search) — technical keywords/tags rank highest";
                    };
                    readonly tags: {
                        readonly type: "string";
                        readonly description: "Comma-separated tags (add)";
                    };
                    readonly type: {
                        readonly type: "string";
                        readonly description: "Memory type (add)";
                    };
                    readonly memoryId: {
                        readonly type: "string";
                        readonly description: "Memory id (forget)";
                    };
                    readonly limit: {
                        readonly type: "number";
                        readonly description: "Result limit (list/search)";
                    };
                    readonly scope: {
                        readonly type: "string";
                        readonly enum: readonly ["project", "all-projects"];
                        readonly description: "Search/list scope";
                    };
                    readonly fromPath: {
                        readonly type: "string";
                        readonly description: "Orphaned project path (migrate)";
                    };
                    readonly fromHash: {
                        readonly type: "string";
                        readonly description: "Orphaned project hash (migrate)";
                    };
                    readonly outputPath: {
                        readonly type: "string";
                        readonly description: "Export target JSON file (export)";
                    };
                    readonly inputPath: {
                        readonly type: "string";
                        readonly description: "Import source JSON file (import)";
                    };
                    readonly dryRun: {
                        readonly type: "boolean";
                        readonly description: "Preview without applying (migrate/import)";
                    };
                    readonly allowLinkedSource: {
                        readonly type: "boolean";
                        readonly description: "Allow migrating from a linked source path (migrate)";
                    };
                };
                readonly additionalProperties: false;
            };
            execute(args: {
                mode?: "add" | "search" | "profile" | "list" | "forget" | "help" | "migrate" | "list-shards" | "export" | "import";
                content?: string;
                query?: string;
                tags?: string;
                type?: MemoryType;
                memoryId?: string;
                limit?: number;
                scope?: MemoryScope;
                fromPath?: string;
                fromHash?: string;
                outputPath?: string;
                inputPath?: string;
                dryRun?: boolean;
                allowLinkedSource?: boolean;
            }): Promise<string>;
        };
    };
    event: (input: {
        event: {
            type: string;
            properties?: any;
        };
    }) => Promise<void>;
}>;
//# sourceMappingURL=index.d.ts.map