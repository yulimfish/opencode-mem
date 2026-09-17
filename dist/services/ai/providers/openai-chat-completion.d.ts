import { BaseAIProvider, type ProviderConfig, type ToolCallResult } from "./base-provider.js";
import type { AISessionManager } from "../session/ai-session-manager.js";
import type { AIMessage, AIProviderType } from "../session/session-types.js";
import type { ChatCompletionTool } from "../tools/tool-schema.js";
export declare class OpenAIChatCompletionProvider extends BaseAIProvider {
    private readonly aiSessionManager;
    constructor(config: ProviderConfig, aiSessionManager: AISessionManager);
    getProviderName(): string;
    supportsSession(): boolean;
    /** Provider tag used for AI session storage and diagnostics. */
    protected sessionProviderTag(): AIProviderType;
    /**
     * Resolve the OpenAI-compatible API base URL.
     * Trailing slashes are stripped so `${base}/chat/completions` is well-formed.
     */
    protected resolveEndpoint(): string;
    /** Resolve the model ID sent in the request body. */
    protected resolveModel(): string;
    private addToolResponse;
    protected filterIncompleteToolCallSequences(messages: AIMessage[]): AIMessage[];
    executeToolCall(systemPrompt: string, userPrompt: string, toolSchema: ChatCompletionTool, sessionId: string): Promise<ToolCallResult>;
}
//# sourceMappingURL=openai-chat-completion.d.ts.map