import type { PluginInput } from "@opencode-ai/plugin";
interface ToolCallInfo {
    name: string;
    input: string;
}
export declare function performAutoCapture(ctx: PluginInput, sessionID: string, directory: string): Promise<void>;
export declare function getAutoCaptureMarkdownBudget(totalRequestBytes?: number): number;
export declare function buildBoundedSummaryPrompt(context: string, systemPrompt: string, schema: unknown, totalRequestBytes?: number): string;
/** Build auto-capture markdown context, capped to autoCaptureMaxContextBytes (UTF-8). */
export declare function buildMarkdownContext(userPrompt: string, textResponses: string[], toolCalls: ToolCallInfo[], latestMemory: string | null, maxContextBytes?: number): string;
export {};
//# sourceMappingURL=auto-capture.d.ts.map