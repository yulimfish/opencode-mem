import { type ResolveMigrationSourceOptions, type ResolvedMigrationSource } from "./shard-inventory-service.js";
export interface PathMigrationOptions extends ResolveMigrationSourceOptions {
    currentDirectory: string;
    dryRun?: boolean;
    allowLinkedSource?: boolean;
}
export interface PathMigrationAction {
    type: "rename" | "archive-empty-target" | "update-memories" | "update-prompts" | "reassign-metadata";
    detail: string;
}
export interface PathMigrationResult {
    success: boolean;
    dryRun: boolean;
    migratedShards?: number;
    migratedMemories?: number;
    oldPath?: string | null;
    newPath?: string;
    oldHash?: string;
    newHash?: string;
    matchedBy?: ResolvedMigrationSource["matchedBy"];
    actions?: PathMigrationAction[];
    error?: string;
    candidates?: unknown[];
}
export declare class ShardPathMigrationService {
    migrate(options: PathMigrationOptions): Promise<PathMigrationResult>;
    private rollbackSwap;
    /** Roll back an interrupted staged swap before normal storage access resumes. */
    recoverInterruptedSwap(): Promise<void>;
}
export declare const shardPathMigrationService: ShardPathMigrationService;
//# sourceMappingURL=shard-path-migration-service.d.ts.map