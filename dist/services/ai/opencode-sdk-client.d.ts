import type { OpencodeClient } from "@opencode-ai/sdk/v2/client";
export type HostTransport = {
    readonly fetch?: typeof fetch;
    readonly headers?: RequestInit["headers"];
};
export declare function createLazyV2Client(baseUrl: string, transport?: HostTransport): OpencodeClient;
//# sourceMappingURL=opencode-sdk-client.d.ts.map