export interface ToolCallResult {
    success: boolean;
    data?: any;
    error?: string;
    iterations?: number;
}
export interface ProviderConfig {
    model: string;
    apiUrl: string;
    apiKey?: string;
    maxIterations?: number;
    iterationTimeout?: number;
    maxTokens?: number;
    memoryTemperature?: number | false;
    extraParams?: Record<string, unknown>;
}
export declare function applySafeExtraParams(requestBody: Record<string, any>, extraParams: Record<string, unknown>): void;
export declare abstract class BaseAIProvider {
    protected config: ProviderConfig;
    constructor(config: ProviderConfig);
    abstract executeToolCall(systemPrompt: string, userPrompt: string, toolSchema: any, sessionId: string): Promise<ToolCallResult>;
    abstract getProviderName(): string;
    abstract supportsSession(): boolean;
}
//# sourceMappingURL=base-provider.d.ts.map