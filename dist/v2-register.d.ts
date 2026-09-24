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
import { Plugin } from "@opencode/plugin";
type V2Context = Plugin.Context;
export declare function registerMemPlugin(ctx: V2Context): Promise<() => void>;
export {};
//# sourceMappingURL=v2-register.d.ts.map