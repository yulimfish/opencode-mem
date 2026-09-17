const PROTECTED_KEYS = new Set([
    "model",
    "messages",
    "tools",
    "tool_choice",
    "temperature",
    "input",
    "instructions",
    "conversation",
    "stream",
]);
export function applySafeExtraParams(requestBody, extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
        if (!PROTECTED_KEYS.has(key)) {
            requestBody[key] = value;
        }
    }
}
export class BaseAIProvider {
    config;
    constructor(config) {
        this.config = config;
    }
}
