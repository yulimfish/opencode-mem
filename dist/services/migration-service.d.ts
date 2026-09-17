export interface DimensionMismatch {
    needsMigration: boolean;
    configDimensions: number;
    configModel: string;
    shardMismatches: Array<{
        shardId: number;
        dbPath: string;
        storedDimensions: number;
        storedModel: string;
        vectorCount: number;
    }>;
}
export interface MigrationProgress {
    phase: "preparing" | "re-embedding" | "cleanup" | "complete";
    processed: number;
    total: number;
    currentShard?: string;
}
export interface MigrationResult {
    success: boolean;
    strategy: "fresh-start" | "re-embed";
    deletedShards: number;
    reEmbeddedMemories: number;
    duration: number;
    error?: string;
}
export declare class MigrationService {
    private isRunning;
    private progressCallback?;
    detectDimensionMismatch(): Promise<DimensionMismatch>;
    migrateToNewModel(strategy: "fresh-start" | "re-embed", progressCallback?: (progress: MigrationProgress) => void): Promise<MigrationResult>;
    private freshStartMigration;
    private reEmbedMigration;
    private rebuildShardSafely;
    private reportProgress;
    getStatus(): {
        isRunning: boolean;
        configModel: string;
        configDimensions: number;
    };
}
export declare const migrationService: MigrationService;
//# sourceMappingURL=migration-service.d.ts.map