export async function loadOpencodeProvider() {
    const providerModule = await import("./opencode-provider.js");
    return providerModule;
}
