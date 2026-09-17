import { type ProviderConfig } from "./base-provider.js";
import { AISessionManager } from "../session/ai-session-manager.js";
import { AnthropicMessagesProvider } from "./anthropic-messages.js";
import type { AIProviderType } from "../session/session-types.js";
/**
 * MiniMax provider.
 *
 * MiniMax exposes an Anthropic Messages-compatible endpoint for its text
 * models. The global endpoint (https://api.minimax.io) and the China endpoint
 * (https://api.minimaxi.com) both expose the same `/anthropic/v1/messages`
 * path and authenticate with the `x-api-key` header. This provider reuses the
 * Anthropic Messages request/response handling and only overrides the resolved
 * request endpoint URL and the session provider tag, so MiniMax is
 * distinguishable from Anthropic in the session store and diagnostics.
 *
 * Users configure the base URL as `memoryApiUrl`:
 *   - global endpoint: "https://api.minimax.io"
 *   - China endpoint:  "https://api.minimaxi.com"
 */
export declare class MiniMaxProvider extends AnthropicMessagesProvider {
    constructor(config: ProviderConfig, aiSessionManager: AISessionManager);
    getProviderName(): string;
    /**
     * Resolve the Anthropic Messages endpoint URL for MiniMax.
     *
     * MiniMax's Messages endpoint lives at `<base>/anthropic/v1/messages`. The
     * base URL is normalized so users can supply the host with or without a
     * trailing `/anthropic`, `/anthropic/v1`, or `/anthropic/v1/messages` suffix.
     */
    resolveEndpoint(): string;
    sessionProviderTag(): AIProviderType;
    protected apiErrorLogLabel(): string;
    protected toolValidationErrorLogLabel(): string;
    protected timeoutLabel(): string;
}
//# sourceMappingURL=minimax.d.ts.map