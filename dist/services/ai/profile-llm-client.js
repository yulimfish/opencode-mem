import { CONFIG } from "../../config.js";
import { loadOpencodeProvider } from "./opencode-provider-loader.js";
let _cachedClient = null;
let _cachedProvider = null;
let _cachedModel = null;
export async function getOpenCodeClient() {
    const provider = CONFIG.opencodeProvider;
    const model = CONFIG.opencodeModel;
    if (!provider || !model) {
        throw new Error("opencode-mem: opencodeProvider and opencodeModel must be configured");
    }
    if (_cachedClient && _cachedProvider === provider && _cachedModel === model) {
        return _cachedClient;
    }
    const { isProviderConnected, getV2Client } = await loadOpencodeProvider();
    if (!isProviderConnected(provider)) {
        throw new Error(`opencode provider '${provider}' is not connected. Check your opencode provider configuration.`);
    }
    const client = getV2Client();
    if (!client) {
        throw new Error("opencode-mem: v2 client not initialized");
    }
    _cachedClient = client;
    _cachedProvider = provider;
    _cachedModel = model;
    return client;
}
