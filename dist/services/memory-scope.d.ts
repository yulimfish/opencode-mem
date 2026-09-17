export declare const SCOPE_HASH_PATTERN: RegExp;
export declare function isValidScopeHash(hash: string): boolean;
export declare function assertSafeScopeHash(scopeHash: string): void;
export declare function extractScopeFromContainerTag(containerTag: string): {
    scope: "user" | "project";
    hash: string;
};
export declare function tryExtractScopeFromContainerTag(containerTag: string): {
    scope: "user" | "project";
    hash: string;
} | null;
export interface MemoryScopeRef {
    scope: "user" | "project";
    hash: string;
}
export declare function resolveMemoryScope(scope: "project" | "all-projects", containerTag: string): MemoryScopeRef[];
//# sourceMappingURL=memory-scope.d.ts.map