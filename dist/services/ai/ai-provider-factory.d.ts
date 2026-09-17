import { BaseAIProvider, type ProviderConfig } from "./providers/base-provider.js";
import type { AIProviderType } from "./session/session-types.js";
export declare class AIProviderFactory {
    static createProvider(providerType: AIProviderType, config: ProviderConfig): BaseAIProvider;
    static getSupportedProviders(): AIProviderType[];
    static cleanupExpiredSessions(): Promise<number>;
}
//# sourceMappingURL=ai-provider-factory.d.ts.map