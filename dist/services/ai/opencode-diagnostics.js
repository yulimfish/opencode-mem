export function diagnosticUrl(url) {
    try {
        const parsed = new URL(url);
        parsed.search = "";
        return parsed.toString();
    }
    catch {
        return url.split("?")[0] ?? url;
    }
}
export function responseStatus(res) {
    const statusTextByCode = {
        500: "Internal Server Error",
        502: "Bad Gateway",
    };
    return `${res.status} ${res.statusText || statusTextByCode[res.status] || "Unknown Status"}`;
}
function redactedBody(text) {
    return text ? "<redacted response body>" : "<empty body>";
}
export async function readJson(res, endpoint) {
    const text = await res.text();
    const url = diagnosticUrl(endpoint.url);
    if (!res.ok) {
        throw new Error(`opencode-mem: opencode ${endpoint.label} failed at ${url} (${responseStatus(res)}): ${redactedBody(text)}`);
    }
    if (!text) {
        throw new Error(`opencode-mem: opencode ${endpoint.label} at ${url} returned an empty response body`);
    }
    try {
        return JSON.parse(text);
    }
    catch {
        throw new Error(`opencode-mem: opencode ${endpoint.label} at ${url} returned non-JSON body: ${redactedBody(text)}`);
    }
}
