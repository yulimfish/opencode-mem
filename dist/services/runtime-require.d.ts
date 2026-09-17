export type RuntimeImportMeta = ImportMeta & {
    require?: NodeRequire;
    path?: string;
    dirname?: string;
    dir?: string;
    resolve?: (specifier: string) => string;
};
/**
 * Build a require() for resolving/loading packages next to this plugin module.
 * Throws a concrete diagnostic when no usable Bun/Node anchor exists.
 *
 * Prefer a path/url-anchored createRequire over Bun's import.meta.require when a
 * concrete file anchor exists. In OpenCode's Bun --compile host, import.meta.url
 * and import.meta.path are still valid for dynamically imported plugins even when
 * some require referrers later surface as `from ''` (#210).
 */
export declare function createRuntimeRequire(meta: RuntimeImportMeta): NodeRequire;
//# sourceMappingURL=runtime-require.d.ts.map