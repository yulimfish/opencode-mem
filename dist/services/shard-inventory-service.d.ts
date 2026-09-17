export type ShardInventoryStatus = "current" | "linked" | "orphaned" | "missing-file" | "empty" | "ambiguous";
export interface ProjectShardDescriptor {
    shardId: number | null;
    shardIndex: number;
    dbPath: string;
    fileName: string;
    isActive: boolean;
    vectorCount: number;
    memoryCount: number;
    fileExists: boolean;
}
export interface ProjectShardGroup {
    scope: "project";
    scopeHash: string;
    shardIndices: number[];
    shards: ProjectShardDescriptor[];
    memoryCount: number;
    containerTag: string | null;
    projectPath: string | null;
    projectPathCandidates: Array<{
        path: string;
        count: number;
    }>;
    projectName: string | null;
    gitRepoUrl: string | null;
    pathExists: boolean;
    status: ShardInventoryStatus;
    matchesCurrentProject: boolean;
}
export interface ListShardsResult {
    success: true;
    storagePath: string;
    currentProject: {
        tag: string;
        scopeHash: string;
        projectPath: string;
    };
    shards: ProjectShardGroup[];
    summary: {
        total: number;
        current: number;
        linked: number;
        orphaned: number;
        missingFile: number;
        empty: number;
        ambiguous: number;
    };
}
export interface ResolveMigrationSourceOptions {
    fromPath?: string;
    fromHash?: string;
}
export interface ResolvedMigrationSource {
    scopeHash: string;
    matchedBy: "fromHash" | "storedProjectPath" | "liveProjectIdentity";
    group: ProjectShardGroup;
}
export interface ResolveMigrationSourceResult {
    success: boolean;
    source?: ResolvedMigrationSource;
    candidates?: ProjectShardGroup[];
    error?: string;
}
export declare function normalizeProjectPath(path: string): string;
export declare class ShardInventoryService {
    listShards(currentDirectory: string): Promise<ListShardsResult>;
    resolveMigrationSource(currentDirectory: string, options: ResolveMigrationSourceOptions): Promise<ResolveMigrationSourceResult>;
}
export declare const shardInventoryService: ShardInventoryService;
//# sourceMappingURL=shard-inventory-service.d.ts.map