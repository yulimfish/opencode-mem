function getOpencodeSdkClientSpecifier() {
    return ["@opencode-ai/sdk", "/v2/client"].join("");
}
async function createSdkClient(baseUrl, transport) {
    const sdk = (await import(getOpencodeSdkClientSpecifier()));
    return sdk.createOpencodeClient({
        baseUrl,
        ...(transport?.fetch ? { fetch: transport.fetch } : {}),
        ...(transport?.headers ? { headers: transport.headers } : {}),
    });
}
export function createLazyV2Client(baseUrl, transport) {
    let sdkClientPromise;
    const getSdkClient = () => {
        sdkClientPromise ??= createSdkClient(baseUrl, transport);
        return sdkClientPromise;
    };
    return {
        session: {
            create: async (...args) => {
                const client = await getSdkClient();
                return client.session.create(...args);
            },
            prompt: async (...args) => {
                const client = await getSdkClient();
                return client.session.prompt(...args);
            },
            delete: async (...args) => {
                const client = await getSdkClient();
                return client.session.delete(...args);
            },
            abort: async (...args) => {
                const client = await getSdkClient();
                return client.session.abort(...args);
            },
        },
    };
}
