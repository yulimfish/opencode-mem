export type HostClientConfig = {
    readonly baseUrl: string | undefined;
    readonly fetch: typeof fetch | undefined;
    readonly headers?: RequestInit["headers"];
    readonly clientKeys: readonly string[];
    readonly sdkConfigCount: number;
};
export declare function getHostClientConfig(ctx: {
    readonly client: unknown;
}): HostClientConfig;
//# sourceMappingURL=opencode-host-config.d.ts.map