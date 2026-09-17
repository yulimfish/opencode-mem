import type { ShardInfo } from "./types.js";
import type { TursoDb } from "./turso-db.js";
export declare class TursoShardManager {
    private metadataDb;
    private metadataPath;
    private initPromise;
    private readonly writeLocks;
    reset(): void;
    withScopeWriteLock<T>(scope: "user" | "project", scopeHash: string, fn: () => Promise<T>): Promise<T>;
    private ensureInitialized;
    private initMetadataDb;
    getShardPath(scope: "user" | "project", scopeHash: string, shardIndex: number): string;
    private resolveStoredPath;
    getActiveShard(scope: "user" | "project", scopeHash: string): Promise<ShardInfo | null>;
    getAllShards(scope: "user" | "project", scopeHash: string): Promise<ShardInfo[]>;
    createShard(scope: "user" | "project", scopeHash: string, shardIndex: number): Promise<ShardInfo>;
    registerExistingShard(scope: "user" | "project", scopeHash: string, shardIndex: number, dbPath: string, vectorCount: number, isActive: boolean): Promise<ShardInfo>;
    initShardDb(db: TursoDb, dimensions?: number, embeddingModel?: string): Promise<void>;
    private rowToShardInfo;
    private hasMatchingEmbeddingDimensions;
    private syncShardVectorCount;
    private isShardValid;
    getWriteShard(scope: "user" | "project", scopeHash: string): Promise<ShardInfo>;
    private markShardReadOnly;
    incrementVectorCount(shardId: number): Promise<void>;
    decrementVectorCount(shardId: number): Promise<void>;
    setVectorCount(shardId: number, count: number): Promise<void>;
    getShardById(shardId: number): Promise<ShardInfo | null>;
    getShardByPath(dbPath: string): Promise<ShardInfo | null>;
    deleteShard(shardId: number): Promise<void>;
    archiveShard(shardId: number, reason: string, archivePathOverride?: string): Promise<string | null>;
    /**
     * Reassign a registered shard to a new scope hash and on-disk filename.
     * Caller must close the DB connection and rename the file before calling this.
     */
    reassignShardScope(shardId: number, newScopeHash: string, newDbPath: string, vectorCount: number, isActive: boolean): Promise<ShardInfo>;
}
export declare const tursoShardManager: TursoShardManager;
//# sourceMappingURL=shard-manager.d.ts.map