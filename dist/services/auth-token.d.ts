export declare const AUTH_HEADER = "x-opencode-mem-token";
/**
 * A shared secret generated on first run and persisted to a local,
 * user-only-readable file. Required on every /api/* request so that a
 * malicious web page (which cannot read cross-origin/opaque responses,
 * including the token injected into index.html) cannot drive the API via
 * CSRF even though the CORS check alone lets no-Origin requests through.
 */
export declare function getOrCreateAuthToken(): string;
export declare function isAuthorizedApiRequest(req: Request): boolean;
//# sourceMappingURL=auth-token.d.ts.map