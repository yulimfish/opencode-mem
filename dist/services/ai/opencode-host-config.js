export function getHostClientConfig(ctx) {
    const client = toRecord(ctx.client);
    if (!client) {
        return { baseUrl: undefined, fetch: undefined, clientKeys: [], sdkConfigCount: 0 };
    }
    const configs = sdkConfigs(client);
    const baseUrl = configs.find((config) => typeof config["baseUrl"] === "string")?.["baseUrl"];
    const customFetch = configs.find((config) => isFetch(config["fetch"]))?.["fetch"];
    const headers = configs.find((config) => isHeadersInit(config["headers"]))?.["headers"];
    return {
        baseUrl: typeof baseUrl === "string" ? baseUrl : undefined,
        fetch: isFetch(customFetch) ? customFetch : undefined,
        ...(isHeadersInit(headers) ? { headers } : {}),
        clientKeys: Object.keys(client),
        sdkConfigCount: configs.length,
    };
}
function sdkConfigs(client) {
    const configs = [];
    const nestedClients = Object.values(client).flatMap((value) => {
        const record = toRecord(value);
        return record ? [record] : [];
    });
    const candidates = [client, ...nestedClients];
    for (const candidate of candidates) {
        const sdkClient = toRecord(candidate["_client"]);
        const getConfig = sdkClient?.["getConfig"];
        if (!isConfigGetter(getConfig))
            continue;
        const config = toRecord(getConfig.call(sdkClient));
        if (config)
            configs.push(config);
    }
    return configs;
}
function toRecord(value) {
    if (typeof value !== "object" || value === null)
        return undefined;
    return value;
}
function isConfigGetter(value) {
    return typeof value === "function";
}
function isFetch(value) {
    return typeof value === "function";
}
function isHeadersInit(value) {
    return (value instanceof Headers ||
        Array.isArray(value) ||
        (typeof value === "object" && value !== null));
}
