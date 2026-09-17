import type { MemoryRecord, SearchResult, ShardInfo } from "./types.js";
import type { TursoDb } from "./turso-db.js";
import type { Transaction } from "@libsql/client";
export declare class TursoVectorSearch {
    insertVectorInTransaction(tx: Transaction, record: MemoryRecord): Promise<void>;
    insertVector(db: TursoDb, record: MemoryRecord): Promise<void>;
    searchInShard(shard: ShardInfo, queryVector: Float32Array, containerTag: string, limit: number, queryText?: string): Promise<SearchResult[]>;
    private searchKind;
    private exactScanKind;
    searchAcrossShards(shards: ShardInfo[], queryVector: Float32Array, containerTag: string, limit: number, similarityThreshold: number, queryText?: string): Promise<{
        results: SearchResult[];
        warnings: string[];
    }>;
    deleteVector(db: TursoDb, memoryId: string): Promise<void>;
    updateVector(db: TursoDb, memoryId: string, vector: Float32Array, tagsVector?: Float32Array): Promise<void>;
    listMemories(db: TursoDb, containerTag: string, limit: number, options?: {
        includeNonRetrievable?: boolean;
    }): Promise<Record<string, unknown>[]>;
    getAllMemories(db: TursoDb): Promise<Record<string, unknown>[]>;
    getAllMemoriesWithExtractedVectors(db: TursoDb): Promise<Array<Record<string, unknown> & {
        vector_json: string | null;
    }>>;
    getMemoryById(db: TursoDb, memoryId: string): Promise<Record<string, unknown> | null>;
    getMemoriesBySessionID(db: TursoDb, sessionID: string): Promise<Record<string, unknown>[]>;
    updateMemoryState(db: TursoDb, memoryId: string, state: {
        isStaged?: boolean;
        validUntil?: number;
        source?: string;
        authority?: string;
        observedAt?: number;
    }): Promise<void>;
    recordInjection(db: TursoDb, memoryId: string): Promise<void>;
    countVectors(db: TursoDb, containerTag: string): Promise<number>;
    countAllVectors(db: TursoDb): Promise<number>;
    getDistinctTags(db: TursoDb): Promise<Record<string, unknown>[]>;
    getProjectPathCounts(db: TursoDb): Promise<Array<{
        projectPath: string;
        count: number;
        containerTag: string | null;
    }>>;
    updateProjectAssociation(db: TursoDb, oldContainerTag: string, update: {
        containerTag: string;
        projectPath?: string;
        projectName?: string;
        displayName?: string;
        gitRepoUrl?: string | null;
    }): Promise<number>;
    pinMemory(db: TursoDb, memoryId: string): Promise<void>;
    unpinMemory(db: TursoDb, memoryId: string): Promise<void>;
}
export declare const tursoVectorSearch: TursoVectorSearch;
//# sourceMappingURL=vector-search.d.ts.map