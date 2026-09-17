import type { ProviderConfig } from "./providers/base-provider.js";
interface MemoryProviderRuntimeConfig {
    memoryProvider?: string;
    memoryModel?: string;
    memoryApiUrl?: string;
    memoryApiKey?: string;
    memoryTemperature?: number | false;
    memoryExtraParams?: Record<string, unknown>;
    autoCaptureMaxIterations?: number;
    autoCaptureIterationTimeout?: number;
}
interface ProviderConfigOverrides {
    maxIterations?: number;
    iterationTimeout?: number;
}
export declare function buildMemoryProviderConfig(config: MemoryProviderRuntimeConfig, overrides?: ProviderConfigOverrides): ProviderConfig;
export {};
//# sourceMappingURL=provider-config.d.ts.map