export const SCOPE_HASH_PATTERN = /^[a-f0-9]{16}$/;
export function isValidScopeHash(hash) {
    return SCOPE_HASH_PATTERN.test(hash);
}
export function assertSafeScopeHash(scopeHash) {
    if (!isValidScopeHash(scopeHash)) {
        throw new Error(`Invalid scope hash: expected 16 lowercase hex characters, got "${scopeHash}"`);
    }
}
export function extractScopeFromContainerTag(containerTag) {
    const parts = containerTag.split("_");
    if (parts.length < 3) {
        throw new Error(`Invalid containerTag: expected format {prefix}_{user|project}_{16hex}, got "${containerTag}"`);
    }
    const hash = parts[parts.length - 1];
    const scope = parts[parts.length - 2];
    if (scope !== "user" && scope !== "project") {
        throw new Error(`Invalid containerTag scope: "${scope}" in "${containerTag}"`);
    }
    if (!isValidScopeHash(hash)) {
        throw new Error(`Invalid containerTag hash: expected 16 lowercase hex characters in "${containerTag}"`);
    }
    return { scope, hash };
}
export function tryExtractScopeFromContainerTag(containerTag) {
    try {
        return extractScopeFromContainerTag(containerTag);
    }
    catch {
        return null;
    }
}
export function resolveMemoryScope(scope, containerTag) {
    // "all-projects" must span both canonical scopes: user-scope memories live in
    // user shards and would be silently excluded if only project shards were walked.
    if (scope === "all-projects") {
        return [
            { scope: "user", hash: "" },
            { scope: "project", hash: "" },
        ];
    }
    return [extractScopeFromContainerTag(containerTag)];
}
