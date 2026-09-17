export declare const WEB_AUTH_REALM = "OpenCode Memory Explorer";
export interface WebAuthOptions {
    /**
     * Plain-text password used for HTTP Basic Auth. Empty / undefined disables
     * auth entirely (the previous default). The caller is responsible for
     * resolving `env://` / `file://` shortcuts via the shared
     * `resolveSecretValue` helper before passing the value in.
     */
    password?: string;
    /**
     * Plain-text username. Defaults to `os.userInfo().username` so that, when
     * the server is bound to a LAN-reachable interface, the obvious choice
     * is the OS account that launched opencode.
     */
    username?: string;
}
export interface WebAuthConfig {
    enabled: boolean;
    username: string;
}
export interface AuthCheckResult {
    ok: boolean;
    response?: Response;
}
export declare class WebAuth {
    private readonly enabled;
    private readonly username;
    private readonly expectedUsername;
    private readonly expectedPassword;
    constructor(options?: WebAuthOptions);
    getConfig(): WebAuthConfig;
    isEnabled(): boolean;
    /**
     * Validate the HTTP Basic Auth credentials on the incoming request.
     *
     * Returns `{ ok: true }` when auth is disabled, when the request is for a
     * path the user-facing browser must reach without credentials (the health
     * probe), or when the supplied `Authorization: Basic …` header matches the
     * configured username/password.
     *
     * Otherwise returns a fully-formed 401 Response carrying the
     * `WWW-Authenticate` challenge so browsers pop their native login dialog.
     */
    check(req: Request, path: string): AuthCheckResult;
    challenge(): Response;
}
//# sourceMappingURL=web-auth.d.ts.map