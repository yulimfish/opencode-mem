export interface CorsAllowOptions {
    /**
     * Whether HTTP Basic Auth is enforced by the web server. When true, the
     * CORS gate opens up beyond loopback origins — the auth challenge is what
     * actually protects memory data, so locking CORS down to loopback is
     * unnecessary once Basic Auth is on.
     */
    httpAuthEnabled?: boolean;
}
export declare function isAllowedBrowserOrigin(origin: string | null, options?: CorsAllowOptions): boolean;
export declare function corsPreflightResponse(req: Request, options?: CorsAllowOptions): Response;
export declare function disallowedCorsResponse(): Response;
//# sourceMappingURL=cors.d.ts.map