export declare function getPinnedOnnxruntimePackageRoot(): string;
/**
 * Resolve the N-API layout directory shipped by the pinned onnxruntime-node
 * package (`napi-v3` for 1.20.x, `napi-v6` for 1.22.x, …).
 */
export declare function getOnnxruntimeNapiDirName(platform?: NodeJS.Platform, arch?: string): string;
export declare function getOnnxruntimeBindingPath(platform?: NodeJS.Platform, arch?: string): string;
export declare function formatMissingOnnxruntimeBindingError(platform?: NodeJS.Platform, arch?: string): string;
/**
 * Rewrite onnxruntime-related init failures.
 *
 * When the pinned binding is absent, keep the clear "missing" message.
 * When it is present, preserve the original error so nested-1.24 / dlopen /
 * codesign failures are not misreported as a missing pinned binding (#210).
 */
export declare function formatOnnxruntimeInitError(error: unknown, platform?: NodeJS.Platform, arch?: string): Error;
export declare function assertOnnxruntimeBindingPresent(platform?: NodeJS.Platform, arch?: string): void;
/**
 * Patch Module._resolveFilename so require() of onnxruntime-node / onnxruntime-common
 * from nested transformers resolves to our direct pinned dependency stack.
 */
export declare function installOnnxruntimeResolveShim(): void;
/** Install resolve shim and fail fast if the platform binding is absent. */
export declare function prepareOnnxruntimeForTransformers(): void;
//# sourceMappingURL=onnxruntime-resolve.d.ts.map