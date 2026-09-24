/**
 * V2 plugin registration for opencode-mem.
 *
 * OpenCode V2 replaced the V1 plugin API (hooks returned from a plugin
 * function) with domain-registered hooks/transforms on the plugin context
 * (`Plugin.define({ id, setup(ctx) })`). This module adapts the plugin's
 * legacy hook implementations (src/index.ts) onto the V2 surface:
 *
 *   V1                          -> V2
 *   config(cfg)                 -> ctx.agent.transform (upsert internal agent)
 *   chat.message(input, output) -> ctx.session.hook("prompt")   (memory injection)
 *   chat.params(input)          -> ctx.session.hook("context")  (model recording)
 *   tool: { memory }            -> ctx.tool.transform
 *   event(input)                -> ctx.event.subscribe()
 *
 * The legacy internals expect `{ directory, client }` where client is the V1
 * SDK client (path-style args, `{ data }` envelopes, `tui.showToast`). A small
 * adapter maps those calls onto the V2 context domains. The server URL and
 * Basic auth come from the shared service registration
 * (`~/.local/state/opencode/service.json`) so the plugin's own V2 SDK client
 * (structured-output sessions) keeps working without the V1 host client.
 */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Plugin } from "@opencode/plugin";
import { OpenCodeMemPlugin, MEMORY_TOOL_INPUT } from "./index.js";
import { STRUCTURED_OUTPUT_AGENT, isInternalStructuredSession, } from "./services/ai/opencode-provider.js";
import { log } from "./services/logger.js";
import { userPromptManager } from "./services/user-prompt/user-prompt-manager.js";
function readServiceRegistration() {
    const candidates = [
        join(homedir(), ".local", "state", "opencode", "service.json"),
        join(homedir(), ".config", "opencode", "service.json"),
    ];
    for (const file of candidates) {
        try {
            if (!existsSync(file))
                continue;
            const parsed = JSON.parse(readFileSync(file, "utf8"));
            if (typeof parsed?.url === "string")
                return parsed;
        }
        catch {
            // try next candidate
        }
    }
    return undefined;
}
function basicAuthHeader(password) {
    return "Basic " + Buffer.from(`opencode:${password}`).toString("base64");
}
/** Map a V2 flat session message (discriminated by `type`) to the V1 `{ info, parts }` shape. */
function toLegacyMessage(m) {
    const metadata = (m.metadata ?? {});
    const info = {
        id: m.id,
        parentID: m.parentID,
        agent: m.agent,
        mode: m.mode,
    };
    switch (m.type) {
        case "user":
            return {
                info: { ...info, role: "user" },
                parts: [{ type: "text", text: m.text, synthetic: metadata.synthetic === true }],
            };
        case "assistant":
            return {
                info: {
                    ...info,
                    role: "assistant",
                    error: m.error,
                    structured_output: metadata.structured_output,
                    structured: metadata.structured,
                },
                parts: (m.content ?? [])
                    .filter((c) => c?.type === "text")
                    .map((c) => ({ type: "text", text: c.text })),
            };
        case "synthetic":
            return {
                info: { ...info, role: "user" },
                parts: [{ type: "text", text: m.text, synthetic: true }],
            };
        case "compaction":
            return { info: { ...info, role: "assistant", summary: true }, parts: [] };
        default:
            // system / skill / shell / model-selected / etc. — not chat roles.
            return { info: { ...info, role: m.type }, parts: [] };
    }
}
function createLegacyClient(ctx) {
    const service = readServiceRegistration();
    const hostHeaders = service?.password
        ? { Authorization: basicAuthHeader(service.password) }
        : undefined;
    return {
        // Shape expected by getHostClientConfig() to extract the host transport.
        _client: {
            getConfig: () => ({
                ...(service?.url ? { baseUrl: service.url } : {}),
                // The adapter authenticates via headers; the host's own fetch is not
                // exposed on the V2 context, so hand back the global one to avoid the
                // per-init "host fetch unavailable" fallback log.
                fetch: globalThis.fetch,
                ...(hostHeaders ? { headers: hostHeaders } : {}),
            }),
        },
        session: {
            async messages({ path }) {
                const messages = (await ctx.session.context({ sessionID: path.id }));
                return { data: messages.map(toLegacyMessage) };
            },
            async get({ path }) {
                return { data: await ctx.session.get({ sessionID: path.id }) };
            },
            async prompt({ path, body }) {
                // V1 compaction injection: prompt with a synthetic part + noReply.
                // V2 equivalent: ctx.session.synthetic (no assistant generation).
                const text = String(body?.parts?.find((p) => p?.type === "text")?.text ?? "");
                await ctx.session.synthetic({ sessionID: path.id, text });
                return { data: { id: `synthetic-${Date.now()}` } };
            },
        },
        provider: {
            async list() {
                // V2's plugin-context provider list can omit settings-defined custom
                // providers; prefer the full HTTP catalog, fall back to ctx.
                let connected = [];
                try {
                    if (service?.url) {
                        const res = await fetch(`${service.url.replace(/\/$/, "")}/api/provider`, {
                            headers: hostHeaders,
                        });
                        if (res.ok) {
                            const body = (await res.json());
                            connected = (body.data ?? [])
                                .map((p) => p?.id)
                                .filter((id) => typeof id === "string" && id.length > 0);
                        }
                    }
                }
                catch {
                    // fall back to the plugin-context list below
                }
                if (connected.length === 0) {
                    const result = (await ctx.provider.list());
                    connected = (result?.data ?? [])
                        .map((p) => p?.id)
                        .filter((id) => typeof id === "string" && id.length > 0);
                }
                return { data: { connected } };
            },
        },
        tui: {
            async showToast() {
                // V2 has no server-side TUI toast API; toasts are dropped.
            },
        },
    };
}
// --- registration -----------------------------------------------------------
export async function registerMemPlugin(ctx) {
    const directory = ctx.location.directory;
    const legacyCtx = { directory, client: createLegacyClient(ctx) };
    const hooks = (await OpenCodeMemPlugin(legacyCtx));
    // 1. Internal structured-output agent (V1 `config` hook equivalent).
    //    AgentEditor.update() upserts: it creates the agent when missing.
    const agentCfg = {};
    applyStructuredOutputAgentConfigRef(agentCfg);
    const agentSpec = agentCfg.agent?.[STRUCTURED_OUTPUT_AGENT];
    await ctx.agent.transform((editor) => {
        editor.update(STRUCTURED_OUTPUT_AGENT, (agent) => {
            agent.description = String(agentSpec?.description ?? "");
            agent.mode = "subagent";
            agent.hidden = true;
            agent.steps = Number(agentSpec?.steps ?? 2);
            agent.permissions = [
                { action: "*", resource: "*", effect: "deny" },
                { action: "StructuredOutput", resource: "*", effect: "allow" },
            ];
        });
    });
    // 2. Memory tool (V1 `tool` map).
    const v1MemoryTool = hooks.tool?.memory;
    if (v1MemoryTool) {
        await ctx.tool.transform((editor) => {
            editor.add({
                name: "memory",
                description: v1MemoryTool.description,
                input: MEMORY_TOOL_INPUT,
                execute: async (input) => {
                    const result = await v1MemoryTool.execute(input);
                    return { content: typeof result === "string" ? result : JSON.stringify(result) };
                },
            });
        });
    }
    // 3. Memory injection on prompt admission (V1 `chat.message`).
    //    The V2 prompt hook runs pre-admission, so the incoming message is not
    //    yet in the transcript; injection decisions treat the incoming prompt as
    //    an admitted user message.
    if (hooks["chat.message"]) {
        await ctx.session.hook("prompt", async (event) => {
            const userMessage = String(event.prompt?.text ?? "");
            if (!userMessage.trim())
                return;
            const { isConfigured, CONFIG } = await import("./config.js");
            if (!isConfigured() || !CONFIG.chatMessage.enabled)
                return;
            if (isStructuredSummaryPrompt(userMessage))
                return;
            if (isInternalStructuredSession(event.sessionID))
                return;
            try {
                await userPromptManager.savePrompt(event.sessionID, event.messageID, directory, userMessage);
            }
            catch (error) {
                log("prompt hook: savePrompt failed", { error: String(error) });
            }
            const shouldInject = await computeInjectionDecision(ctx, event.sessionID, CONFIG);
            if (!shouldInject)
                return;
            const memoryContext = await buildMemoryContext(ctx, directory, event.sessionID, userMessage, CONFIG);
            if (!memoryContext)
                return;
            event.prompt.text = `${memoryContext}\n\n${event.prompt.text}`;
        });
    }
    // 4. Model recording (V1 `chat.params` → V2 `context` hook). The context
    //    event has no messageID, so record against the session's latest prompt.
    if (hooks["chat.params"]) {
        await ctx.session.hook("context", async (event) => {
            const { isConfigured, CONFIG } = await import("./config.js");
            if (!isConfigured() || CONFIG.opencodeModel !== "inherit")
                return;
            try {
                await userPromptManager.setSessionPromptModel(event.sessionID, event.model?.providerID, event.model?.id);
            }
            catch (error) {
                log("context hook: setSessionPromptModel failed", { error: String(error) });
            }
        });
    }
    // 5. Session lifecycle events (V1 `event` hook → V2 event subscription).
    // V2 renamed the compaction-finished event: map it back to the legacy
    // `session.compacted` type the hook implementation expects.
    const legacyEventHandler = hooks.event;
    const controller = new AbortController();
    if (legacyEventHandler) {
        void (async () => {
            try {
                for await (const raw of ctx.event.subscribe({ signal: controller.signal })) {
                    const e = raw;
                    const type = e.type === "session.compaction.ended" ? "session.compacted" : e.type;
                    try {
                        await legacyEventHandler({
                            event: { type, properties: e.data ?? e.properties },
                        });
                    }
                    catch (error) {
                        log("event dispatch error", { type: e?.type, error: String(error) });
                    }
                }
            }
            catch (error) {
                if (!controller.signal.aborted)
                    log("event subscribe error", { error: String(error) });
            }
        })();
    }
    return () => controller.abort();
}
// --- helpers ----------------------------------------------------------------
function isStructuredSummaryPrompt(userMessage) {
    return (userMessage.includes("# User Profile Analysis") ||
        (userMessage.includes("Analyze this conversation.") && userMessage.includes('type="skip"')));
}
async function computeInjectionDecision(ctx, sessionID, CONFIG) {
    const messages = (await ctx.session.context({ sessionID }));
    const isRealUser = (m) => m?.type === "user" && m?.metadata?.synthetic !== true;
    const historyReal = messages.filter(isRealUser).length;
    // V1 counted the incoming prompt as a real user message; after compaction,
    // inject even when earlier real user messages exist in the transcript.
    const last = messages[messages.length - 1];
    const isAfterCompaction = last?.type === "compaction" && last?.status === "completed";
    return (CONFIG.chatMessage.injectOn === "always" || historyReal === 0 || isAfterCompaction);
}
async function buildMemoryContext(ctx, directory, sessionID, userMessage, CONFIG) {
    const [{ memoryClient }, { getTags }, { formatContextForPrompt },] = await Promise.all([
        import("./services/client.js"),
        import("./services/tags.js"),
        import("./services/context.js"),
    ]);
    try {
        const tags = getTags(directory);
        const searchResult = await memoryClient.searchMemories(userMessage || "memory injection", tags.project.tag, "project");
        let candidates = searchResult.success ? searchResult.results : [];
        if (CONFIG.chatMessage.excludeCurrentSession) {
            candidates = candidates.filter((m) => m.metadata?.sessionID !== sessionID);
        }
        if (CONFIG.chatMessage.maxAgeDays) {
            const cutoff = Date.now() - CONFIG.chatMessage.maxAgeDays * 86400000;
            candidates = candidates.filter((m) => new Date(m.createdAt ?? 0).getTime() > cutoff);
        }
        if (candidates.length === 0)
            return undefined;
        const { rankAndSelect } = await import("./services/hybrid-search.js");
        const hybridCandidates = candidates.map((m) => ({
            id: m.id,
            memory: m.memory,
            similarity: m.similarity ?? 0.5,
            createdAt: m.createdAt ?? Date.now(),
            tags: Array.isArray(m.tags) ? m.tags : [],
            metadata: m.metadata,
            injectCount: m.injectCount ?? m.metadata?.injectCount,
            lastInjectedAt: m.lastInjectedAt ?? m.metadata?.lastInjectedAt,
            authority: m.authority ?? m.metadata?.authority,
        }));
        const selected = rankAndSelect(hybridCandidates, {
            gateEnabled: CONFIG.retrieval.gateEnabled ?? true,
            candidates: CONFIG.retrieval.candidates ?? 20,
            minScore: CONFIG.retrieval.minScore ?? 0.3,
            injectionTokenBudget: CONFIG.retrieval.injectionTokenBudget ?? 2048,
            injectProfileTokenBudget: CONFIG.retrieval.injectProfileTokenBudget ?? 1024,
        });
        if (selected.length === 0)
            return undefined;
        // Record injection counts asynchronously (best-effort, from V1 handler).
        void (async () => {
            try {
                const { tursoVectorSearch } = await import("./services/turso/vector-search.js");
                const { tursoConnectionManager } = await import("./services/turso/connection-manager.js");
                const { tursoShardManager } = await import("./services/turso/shard-manager.js");
                const { extractScopeFromContainerTag } = await import("./services/memory-scope.js");
                const { scope, hash } = extractScopeFromContainerTag(tags.project.tag);
                const shards = await tursoShardManager.getAllShards(scope, hash);
                for (const shard of shards) {
                    try {
                        const db = await tursoConnectionManager.getConnection(shard.dbPath);
                        for (const candidate of selected) {
                            await tursoVectorSearch.recordInjection(db, candidate.id);
                        }
                    }
                    catch {
                        // best-effort; injection count is non-critical
                    }
                }
            }
            catch {
                // best-effort
            }
        })();
        const projectMemories = {
            results: selected.map((c) => ({ similarity: c.similarity, memory: c.memory })),
            total: selected.length,
            timing: 0,
        };
        const userId = tags.user.userEmail || null;
        return (await formatContextForPrompt(userId, projectMemories)) || undefined;
    }
    catch (error) {
        log("memory injection failed", { error: String(error) });
        return undefined;
    }
}
// applyStructuredOutputAgentConfig lives in index.ts; keep a lazy reference to
// avoid a circular import at module-eval time (index.ts imports services that
// import nothing from this module, but stay lazy to match the legacy graph).
let applyConfigRef;
async function applyStructuredOutputAgentConfigRef(cfg) {
    if (!applyConfigRef) {
        const mod = await import("./index.js");
        applyConfigRef = mod.applyStructuredOutputAgentConfig;
    }
    applyConfigRef(cfg);
}
