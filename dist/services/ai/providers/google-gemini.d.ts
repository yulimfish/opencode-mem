import { BaseAIProvider, type ToolCallResult } from "./base-provider.js";
import { AISessionManager } from "../session/ai-session-manager.js";
import type { ChatCompletionTool } from "../tools/tool-schema.js";
/**
 * Google Gemini Provider
 * Supports Google's Gemini models (e.g. gemini-1.5-flash) via Google AI Studio API.
 */
export declare class GoogleGeminiProvider extends BaseAIProvider {
    private aiSessionManager;
    constructor(config: any, aiSessionManager: AISessionManager);
    getProviderName(): string;
    supportsSession(): boolean;
    private addToolResponse;
    executeToolCall(systemPrompt: string, userPrompt: string, toolSchema: ChatCompletionTool, sessionId: string): Promise<ToolCallResult>;
}
//# sourceMappingURL=google-gemini.d.ts.map