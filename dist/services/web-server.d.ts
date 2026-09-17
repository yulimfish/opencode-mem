import { WebAuth } from "./web-auth.js";
type NodeEventSource = {
    on(event: string, listener: (...args: any[]) => void): unknown;
};
export declare function attachNodeDisconnectHandlers(req: NodeEventSource & {
    aborted: boolean;
    complete: boolean;
    socket: NodeEventSource;
}, res: NodeEventSource & {
    writableEnded: boolean;
}, onDisconnect: () => void): void;
/**
 * Port fallback policy for the takeover loop. A port that fails to bind AND
 * answers no HTTP is treated as orphaned Windows kernel residue; after
 * `minFailedTakeovers` consecutive failed takeovers the web server moves to
 * `currentPort + 1`, bounded by `maxFallbackPort`.
 */
export declare function nextFallbackPort(currentPort: number, failedTakeovers: number, maxFallbackPort: number, minFailedTakeovers?: number): number;
interface WebServerConfig {
    port: number;
    host: string;
    enabled: boolean;
    auth?: WebAuth;
    apiToken?: string;
}
export declare class WebServer {
    private server;
    private config;
    private isOwner;
    private startPromise;
    private healthCheckInterval;
    private onTakeoverCallback;
    private onPortsExhaustedCallback;
    private portsExhaustedNotified;
    private takeoverFailures;
    private readonly maxFallbackPort;
    constructor(config: WebServerConfig);
    setOnTakeoverCallback(callback: () => Promise<void>): void;
    setOnPortsExhaustedCallback(callback: () => void): void;
    start(): Promise<void>;
    private _start;
    private startHealthCheckLoop;
    private stopHealthCheckLoop;
    private attemptTakeover;
    private notifyPortsExhausted;
    stop(): Promise<void>;
    isRunning(): boolean;
    isServerOwner(): boolean;
    getUrl(): string;
    checkServerAvailable(): Promise<boolean>;
    private handleRequest;
    private contentTypeFor;
    private serveStaticFile;
    private jsonResponse;
}
export declare function startWebServer(config: WebServerConfig): Promise<WebServer>;
export {};
//# sourceMappingURL=web-server.d.ts.map