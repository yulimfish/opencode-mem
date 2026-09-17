import { BaseAIProvider, type ToolCallResult } from "./base-provider.js";
import { AISessionManager } from "../session/ai-session-manager.js";
import { type ChatCompletionTool } from "../tools/tool-schema.js";
import type { AIProviderType } from "../session/session-types.js";
/**
 * Base implementation for providers that speak the Anthropic Messages API
 * (Anthropic itself plus Anthropic-compatible gateways such as MiniMax).
 *
 * Subclasses override the session provider tag and the resolved endpoint URL so
 * the session store and request routing reflect the upstream provider while the
 * message/tool-call handling stays shared.
 */
export declare class AnthropicMessagesProvider extends BaseAIProvider {
    private aiSessionManager;
    constructor(config: any, aiSessionManager: AISessionManager);
    getProviderName(): string;
    supportsSession(): boolean;
    /**
     * Provider tag stored on AI sessions so a subclass (e.g. MiniMax) records its
     * own tag instead of the literal "anthropic" value.
     */
    protected sessionProviderTag(): AIProviderType;
    /**
     * Resolve the Messages endpoint URL. The default appends `/messages` to the
     * configured base URL, matching Anthropic's `https://api.anthropic.com/v1`
     * base. Subclasses with a different path layout override this.
     */
    protected resolveEndpoint(): string;
    protected apiErrorLogLabel(): string;
    protected toolValidationErrorLogLabel(): string;
    protected timeoutLabel(): string;
    executeToolCall(systemPrompt: string, userPrompt: string, toolSchema: ChatCompletionTool, sessionId: string): Promise<ToolCallResult>;
    private extractToolUse;
}
//# sourceMappingURL=anthropic-messages.d.ts.map