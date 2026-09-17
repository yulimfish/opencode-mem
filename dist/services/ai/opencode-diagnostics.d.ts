export interface FetchEndpoint {
    readonly label: string;
    readonly url: string;
}
export declare function diagnosticUrl(url: string): string;
export declare function responseStatus(res: Response): string;
export declare function readJson<T>(res: Response, endpoint: FetchEndpoint): Promise<T>;
//# sourceMappingURL=opencode-diagnostics.d.ts.map