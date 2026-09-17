import { BaseAIProvider, type ToolCallResult } from "./base-provider.js";
import { AISessionManager } from "../session/ai-session-manager.js";
import { type ChatCompletionTool } from "../tools/tool-schema.js";
export declare class OpenAIResponsesProvider extends BaseAIProvider {
    private aiSessionManager;
    constructor(config: any, aiSessionManager: AISessionManager);
    getProviderName(): string;
    supportsSession(): boolean;
    executeToolCall(systemPrompt: string, userPrompt: string, toolSchema: ChatCompletionTool, sessionId: string): Promise<ToolCallResult>;
    private extractToolCall;
    private buildRetryPrompt;
    private validateResponse;
}
//# sourceMappingURL=openai-responses.d.ts.map