interface CleanupResult {
    deletedCount: number;
    userCount: number;
    projectCount: number;
    promptsDeleted: number;
    linkedMemoriesDeleted: number;
    pinnedMemoriesSkipped: number;
}
export declare class CleanupService {
    private lastCleanupTime;
    private isRunning;
    shouldRunCleanup(): Promise<boolean>;
    runCleanup(): Promise<CleanupResult>;
    getStatus(): {
        enabled: boolean;
        retentionDays: number;
        lastCleanupTime: number;
        isRunning: boolean;
    };
}
export declare const cleanupService: CleanupService;
export {};
//# sourceMappingURL=cleanup-service.d.ts.map