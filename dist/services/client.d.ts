import type { MemoryType } from "../types/index.js";
export type MemoryScope = "project" | "all-projects";
export declare class LocalMemoryClient {
    private initPromise;
    private isInitialized;
    constructor();
    private initialize;
    warmup(progressCallback?: (progress: any) => void): Promise<void>;
    isReady(): Promise<boolean>;
    getEmbeddingInitError(): string | null;
    getStatus(): {
        dbConnected: boolean;
        modelLoaded: boolean;
        ready: boolean;
        embeddingError: string | null;
    };
    reset(): void;
    close(): Promise<void>;
    searchMemories(query: string, containerTag: string, scope?: MemoryScope): Promise<{
        success: true;
        results: import("./turso/types.js").SearchResult[];
        total: number;
        timing: number;
        warnings?: string[] | undefined;
        error?: undefined;
    } | {
        success: false;
        error: string;
        results: never[];
        total: number;
        timing: number;
    }>;
    addMemory(content: string, containerTag: string, metadata?: {
        type?: MemoryType;
        source?: "manual" | "auto-capture" | "import" | "api";
        tags?: string[];
        tool?: string;
        sessionID?: string;
        reasoning?: string;
        captureTimestamp?: number;
        displayName?: string;
        userName?: string;
        userEmail?: string;
        projectPath?: string;
        projectName?: string;
        gitRepoUrl?: string;
        isStaged?: boolean;
        authority?: string;
        observedAt?: number;
        outcome?: string;
        [key: string]: unknown;
    }): Promise<{
        success: true;
        id: string;
    } | {
        success: false;
        error: string;
    }>;
    deleteMemory(memoryId: string): Promise<{
        error?: undefined;
        success: boolean;
    } | {
        success: boolean;
        error: string;
    }>;
    listMemories(containerTag: string, limit?: number, scope?: MemoryScope): Promise<{
        error?: undefined;
        success: true;
        memories: {
            id: any;
            summary: any;
            createdAt: string;
            metadata: any;
            displayName: any;
            userName: any;
            userEmail: any;
            projectPath: any;
            projectName: any;
            gitRepoUrl: any;
            isPinned: boolean;
            isStaged: boolean;
            source: string | undefined;
            authority: string | undefined;
            observedAt: number | undefined;
            validUntil: number;
            injectCount: number;
            lastInjectedAt: number | undefined;
        }[];
        pagination: {
            currentPage: number;
            totalItems: number;
            totalPages: number;
        };
    } | {
        success: false;
        error: string;
        memories: never[];
        pagination: {
            currentPage: number;
            totalItems: number;
            totalPages: number;
        };
    }>;
    ensureStorageReady(): Promise<void>;
    /**
     * Merge multiple memories into one new entry, soft-invalidating originals.
     * All ids must exist and share the same shard. Staged merges are proposals:
     * originals are NOT invalidated until human approval.
     */
    mergeMemories(ids: string[], content: string, opts?: {
        containerTag?: string;
    }): Promise<{
        success: boolean;
        id?: string;
        mergedFrom?: string[];
        error?: string;
    }>;
    listShards(currentDirectory: string): Promise<import("./shard-inventory-service.js").ListShardsResult | {
        success: false;
        error: string;
    }>;
    migrateProjectPath(options: {
        currentDirectory: string;
        fromPath?: string;
        fromHash?: string;
        dryRun?: boolean;
        allowLinkedSource?: boolean;
    }): Promise<import("./shard-path-migration-service.js").PathMigrationResult>;
    exportMemories(currentDirectory: string, outputPath: string): Promise<import("./memory-portability-service.js").ExportMemoriesResult>;
    importMemories(currentDirectory: string, inputPath: string, dryRun?: boolean): Promise<import("./memory-portability-service.js").ImportMemoriesResult>;
    searchMemoriesBySessionID(sessionID: string, containerTag: string, limit?: number): Promise<{
        error?: undefined;
        success: true;
        results: {
            id: any;
            memory: any;
            similarity: number;
            tags: any;
            metadata: any;
            containerTag: any;
            displayName: any;
            userName: any;
            userEmail: any;
            projectPath: any;
            projectName: any;
            gitRepoUrl: any;
            createdAt: any;
        }[];
        total: number;
        timing: number;
    } | {
        success: false;
        error: string;
        results: never[];
        total: number;
        timing: number;
    }>;
}
export declare const memoryClient: LocalMemoryClient;
//# sourceMappingURL=client.d.ts.map