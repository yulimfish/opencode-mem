import { embeddingService } from "./embedding.js";
import { tursoShardManager } from "./turso/shard-manager.js";
import { tursoVectorSearch } from "./turso/vector-search.js";
import { tursoConnectionManager } from "./turso/connection-manager.js";
import { ensureTursoReady } from "./turso/ready.js";
import { formatTagsForEmbedding } from "./turso/vector-utils.js";
import {
  extractScopeFromContainerTag,
  resolveMemoryScope,
  type MemoryScopeRef,
} from "./memory-scope.js";
import { CONFIG } from "../config.js";
import { log } from "./logger.js";
import type { MemoryType } from "../types/index.js";
import type { MemoryRecord } from "./turso/types.js";

export type MemoryScope = "project" | "all-projects";

function safeToISOString(timestamp: any): string {
  try {
    if (timestamp === null || timestamp === undefined) {
      return new Date().toISOString();
    }
    const numValue = typeof timestamp === "bigint" ? Number(timestamp) : Number(timestamp);

    if (isNaN(numValue) || numValue < 0) {
      return new Date().toISOString();
    }

    return new Date(numValue).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function safeJSONParse(jsonString: any): any {
  if (!jsonString || typeof jsonString !== "string") {
    return undefined;
  }
  try {
    return JSON.parse(jsonString);
  } catch {
    return undefined;
  }
}

function resolveScopeValue(scope: MemoryScope, containerTag: string): MemoryScopeRef[] {
  return resolveMemoryScope(scope, containerTag);
}

export class LocalMemoryClient {
  private initPromise: Promise<void> | null = null;
  private isInitialized: boolean = false;

  constructor() {}

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        await ensureTursoReady();
        this.isInitialized = true;
      } catch (error) {
        this.initPromise = null;
        log("Turso initialization failed", { error: String(error) });
        throw error;
      }
    })();

    return this.initPromise;
  }

  async warmup(progressCallback?: (progress: any) => void): Promise<void> {
    await this.initialize();
    await embeddingService.warmup(progressCallback);
  }

  async isReady(): Promise<boolean> {
    return this.isInitialized && embeddingService.isWarmedUp;
  }

  getEmbeddingInitError(): string | null {
    return embeddingService.initError;
  }

  getStatus(): {
    dbConnected: boolean;
    modelLoaded: boolean;
    ready: boolean;
    embeddingError: string | null;
  } {
    return {
      dbConnected: this.isInitialized,
      modelLoaded: embeddingService.isWarmedUp,
      ready: this.isInitialized && embeddingService.isWarmedUp,
      embeddingError: embeddingService.initError,
    };
  }

  reset(): void {
    this.isInitialized = false;
    this.initPromise = null;
  }

  async close(): Promise<void> {
    const { closeTursoAndInvalidateCaches } = await import("./turso/lifecycle.js");
    await closeTursoAndInvalidateCaches();
    this.reset();
  }

  async searchMemories(query: string, containerTag: string, scope: MemoryScope = "project") {
    try {
      await this.initialize();

      const queryVector = await embeddingService.embedWithTimeout(query, { task: "query" });
      const resolved = resolveScopeValue(scope, containerTag);
      const shards = (
        await Promise.all(
          resolved.map((ref) => tursoShardManager.getAllShards(ref.scope, ref.hash))
        )
      ).flat();

      if (shards.length === 0) {
        return { success: true as const, results: [], total: 0, timing: 0 };
      }

      const { results, warnings } = await tursoVectorSearch.searchAcrossShards(
        shards,
        queryVector,
        scope === "all-projects" ? "" : containerTag,
        CONFIG.maxMemories,
        CONFIG.similarityThreshold,
        query
      );

      return {
        success: true as const,
        results,
        total: results.length,
        timing: 0,
        ...(warnings.length > 0 ? { warnings } : {}),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("searchMemories: error", { error: errorMessage });
      return { success: false as const, error: errorMessage, results: [], total: 0, timing: 0 };
    }
  }

  async addMemory(
    content: string,
    containerTag: string,
    metadata?: {
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
    }
  ) {
    try {
      await this.initialize();

      const tags = metadata?.tags || [];
      const vector = await embeddingService.embedWithTimeout(content, { task: "document" });
      let tagsVector: Float32Array | undefined = undefined;

      if (tags.length > 0) {
        tagsVector = await embeddingService.embedWithTimeout(formatTagsForEmbedding(tags), {
          task: "document",
        });
      }

      const { scope, hash } = extractScopeFromContainerTag(containerTag);

      return tursoShardManager.withScopeWriteLock(scope, hash, async () => {
        const shard = await tursoShardManager.getWriteShard(scope, hash);

        const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const now = Date.now();

        const {
          displayName,
          userName,
          userEmail,
          projectPath,
          projectName,
          gitRepoUrl,
          type,
          tags: _tags,
          isStaged,
          authority,
          observedAt,
          source: sourceField,
          ...dynamicMetadata
        } = metadata || {};

        const record: MemoryRecord = {
          id,
          content,
          vector,
          tagsVector,
          containerTag,
          tags: tags.length > 0 ? tags.join(",") : undefined,
          type,
          createdAt: now,
          updatedAt: now,
          displayName,
          userName,
          userEmail,
          projectPath,
          projectName,
          gitRepoUrl,
          isStaged: isStaged ?? false,
          source: (sourceField as string) || "api",
          authority,
          observedAt,
          metadata:
            Object.keys(dynamicMetadata).length > 0 ? JSON.stringify(dynamicMetadata) : undefined,
        };

        const db = await tursoConnectionManager.getConnection(shard.dbPath);
        await tursoVectorSearch.insertVector(db, record);
        await tursoShardManager.incrementVectorCount(shard.id);

        return {
          success: true as const,
          id,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("addMemory: error", { error: errorMessage });
      return { success: false as const, error: errorMessage };
    }
  }

  async deleteMemory(memoryId: string) {
    try {
      await this.initialize();

      const userShards = await tursoShardManager.getAllShards("user", "");
      const projectShards = await tursoShardManager.getAllShards("project", "");
      const allShards = [...userShards, ...projectShards];

      for (const shard of allShards) {
        const db = await tursoConnectionManager.getConnection(shard.dbPath);
        const memory = await tursoVectorSearch.getMemoryById(db, memoryId);

        if (memory) {
          await tursoVectorSearch.deleteVector(db, memoryId);
          await tursoShardManager.decrementVectorCount(shard.id);
          return { success: true };
        }
      }

      return { success: false, error: "Memory not found" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("deleteMemory: error", { memoryId, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async listMemories(containerTag: string, limit = 20, scope: MemoryScope = "project") {
    try {
      await this.initialize();

      const resolved = resolveScopeValue(scope, containerTag);
      const shards = (
        await Promise.all(
          resolved.map((ref) => tursoShardManager.getAllShards(ref.scope, ref.hash))
        )
      ).flat();

      if (shards.length === 0) {
        return {
          success: true as const,
          memories: [],
          pagination: { currentPage: 1, totalItems: 0, totalPages: 0 },
        };
      }

      const allMemories: any[] = [];

      for (const shard of shards) {
        const db = await tursoConnectionManager.getConnection(shard.dbPath);
        const memories = await tursoVectorSearch.listMemories(
          db,
          scope === "all-projects" ? "" : containerTag,
          limit
        );
        allMemories.push(...memories);
      }

      allMemories.sort((a, b) => Number(b.created_at) - Number(a.created_at));

      const memories = allMemories.slice(0, limit).map((r: any) => ({
        id: r.id,
        summary: r.content,
        createdAt: safeToISOString(r.created_at),
        metadata: safeJSONParse(r.metadata),
        displayName: r.display_name,
        userName: r.user_name,
        userEmail: r.user_email,
        projectPath: r.project_path,
        projectName: r.project_name,
        gitRepoUrl: r.git_repo_url,
        isPinned: Number(r.is_pinned ?? 0) === 1,
        isStaged: Number(r.is_staged ?? 0) === 1,
        source: r.source ? String(r.source) : undefined,
        authority: r.authority ? String(r.authority) : undefined,
        observedAt: r.observed_at != null ? Number(r.observed_at) : undefined,
        validUntil: r.valid_until != null ? Number(r.valid_until) : 0,
        injectCount: r.inject_count != null ? Number(r.inject_count) : 0,
        lastInjectedAt: r.last_injected_at != null ? Number(r.last_injected_at) : undefined,
      }));

      return {
        success: true as const,
        memories,
        pagination: { currentPage: 1, totalItems: memories.length, totalPages: 1 },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("listMemories: error", { error: errorMessage });
      return {
        success: false as const,
        error: errorMessage,
        memories: [],
        pagination: { currentPage: 1, totalItems: 0, totalPages: 0 },
      };
    }
  }

  async ensureStorageReady(): Promise<void> {
    await this.initialize();
  }

  /**
   * Merge multiple memories into one new entry, soft-invalidating originals.
   * All ids must exist and share the same shard. Staged merges are proposals:
   * originals are NOT invalidated until human approval.
   */
  async mergeMemories(
    ids: string[],
    content: string,
    opts?: { containerTag?: string }
  ): Promise<{ success: boolean; id?: string; mergedFrom?: string[]; error?: string }> {
    try {
      await this.initialize();

      if (!ids || ids.length < 2) {
        return { success: false, error: "mergeMemories requires at least 2 ids" };
      }

      // Locate all memories and verify they share a shard.
      const userShards = await tursoShardManager.getAllShards("user", "");
      const projectShards = await tursoShardManager.getAllShards("project", "");
      const allShards = [...userShards, ...projectShards];

      let targetShard: (typeof allShards)[number] | null = null;
      const found: Array<{ id: string; row: Record<string, unknown> }> = [];

      for (const shard of allShards) {
        const db = await tursoConnectionManager.getConnection(shard.dbPath);
        for (const id of ids) {
          const row = await tursoVectorSearch.getMemoryById(db, id);
          if (row) {
            if (!targetShard) targetShard = shard;
            else if (targetShard.dbPath !== shard.dbPath) {
              return {
                success: false,
                error: "All memories to merge must reside in the same shard",
              };
            }
            found.push({ id, row });
          }
        }
      }

      if (found.length !== ids.length) {
        const foundIds = new Set(found.map((f) => f.id));
        const missing = ids.filter((id) => !foundIds.has(id));
        return { success: false, error: `Memories not found: ${missing.join(", ")}` };
      }

      if (!targetShard) {
        return { success: false, error: "No shard found for given ids" };
      }

      const isStagedMerge = found.some((f) => Number(f.row.is_staged) === 1);
      const containerTag = opts?.containerTag || String(found[0]?.row.container_tag ?? "");

      // Union tags
      const tagSet = new Set<string>();
      for (const f of found) {
        const tags = f.row.tags ? String(f.row.tags).split(",") : [];
        tags.forEach((t) => t.trim() && tagSet.add(t.trim()));
      }
      const mergedTags = Array.from(tagSet);

      const vector = await embeddingService.embedWithTimeout(content, { task: "document" });
      let tagsVector: Float32Array | undefined;
      if (mergedTags.length > 0) {
        tagsVector = await embeddingService.embedWithTimeout(formatTagsForEmbedding(mergedTags), {
          task: "document",
        });
      }

      const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const now = Date.now();
      const mergedMetadata = {
        mergedFrom: ids,
        mergedAt: now,
      };

      const firstRow = found[0]?.row ?? {};
      const record: MemoryRecord = {
        id,
        content,
        vector,
        tagsVector,
        containerTag,
        tags: mergedTags.length > 0 ? mergedTags.join(",") : undefined,
        createdAt: now,
        updatedAt: now,
        metadata: JSON.stringify(mergedMetadata),
        displayName: firstRow.display_name ? String(firstRow.display_name) : undefined,
        userName: firstRow.user_name ? String(firstRow.user_name) : undefined,
        userEmail: firstRow.user_email ? String(firstRow.user_email) : undefined,
        projectPath: firstRow.project_path ? String(firstRow.project_path) : undefined,
        projectName: firstRow.project_name ? String(firstRow.project_name) : undefined,
        gitRepoUrl: firstRow.git_repo_url ? String(firstRow.git_repo_url) : undefined,
        isStaged: isStagedMerge,
        source: "api",
      };

      const { scope, hash } = extractScopeFromContainerTag(containerTag);
      const db = await tursoConnectionManager.getConnection(targetShard.dbPath);

      return tursoShardManager.withScopeWriteLock(scope, hash, async () => {
        await db.transaction("write", async (tx) => {
          // Insert merged record
          await tursoVectorSearch.insertVectorInTransaction(tx, record);

          // Soft-invalidate originals (unless staged merge)
          if (!isStagedMerge) {
            for (const f of found) {
              const sets = ["valid_until = ?"];
              const args: (string | number)[] = [now, f.id];
              await tx.execute({
                sql: `UPDATE memories SET ${sets.join(", ")} WHERE id = ?`,
                args,
              });
            }
          }
        });

        await tursoShardManager.incrementVectorCount(targetShard!.id);

        return {
          success: true as const,
          id,
          mergedFrom: ids,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("mergeMemories: error", { error: errorMessage });
      return { success: false as const, error: errorMessage };
    }
  }

  async listShards(currentDirectory: string) {
    try {
      await this.initialize();
      const { shardInventoryService } = await import("./shard-inventory-service.js");
      return await shardInventoryService.listShards(currentDirectory);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("listShards: error", { error: errorMessage });
      return { success: false as const, error: errorMessage };
    }
  }

  async migrateProjectPath(options: {
    currentDirectory: string;
    fromPath?: string;
    fromHash?: string;
    dryRun?: boolean;
    allowLinkedSource?: boolean;
  }) {
    try {
      await this.initialize();
      const { shardPathMigrationService } = await import("./shard-path-migration-service.js");
      return await shardPathMigrationService.migrate(options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("migrateProjectPath: error", { error: errorMessage });
      return { success: false as const, dryRun: Boolean(options.dryRun), error: errorMessage };
    }
  }

  async exportMemories(currentDirectory: string, outputPath: string) {
    try {
      await this.initialize();
      const { memoryPortabilityService } = await import("./memory-portability-service.js");
      return await memoryPortabilityService.exportMemories({ currentDirectory, outputPath });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("exportMemories: error", { error: errorMessage });
      return { success: false as const, error: errorMessage };
    }
  }

  async importMemories(currentDirectory: string, inputPath: string, dryRun?: boolean) {
    try {
      await this.initialize();
      const { memoryPortabilityService } = await import("./memory-portability-service.js");
      return await memoryPortabilityService.importMemories({
        currentDirectory,
        inputPath,
        dryRun,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("importMemories: error", { error: errorMessage });
      return { success: false as const, dryRun: Boolean(dryRun), error: errorMessage };
    }
  }

  async searchMemoriesBySessionID(sessionID: string, containerTag: string, limit: number = 10) {
    try {
      await this.initialize();

      const { scope, hash } = extractScopeFromContainerTag(containerTag);
      const shards = await tursoShardManager.getAllShards(scope, hash);

      if (shards.length === 0) {
        return { success: true as const, results: [], total: 0, timing: 0 };
      }

      const allMemories: any[] = [];

      for (const shard of shards) {
        const db = await tursoConnectionManager.getConnection(shard.dbPath);
        const memories = await tursoVectorSearch.getMemoriesBySessionID(db, sessionID);
        allMemories.push(...memories);
      }

      allMemories.sort((a, b) => Number(b.created_at) - Number(a.created_at));

      const results = allMemories.slice(0, limit).map((row: any) => ({
        id: row.id,
        memory: row.content,
        similarity: 1.0,
        tags: row.tags || [],
        metadata: row.metadata || {},
        containerTag: row.container_tag,
        displayName: row.display_name,
        userName: row.user_name,
        userEmail: row.user_email,
        projectPath: row.project_path,
        projectName: row.project_name,
        gitRepoUrl: row.git_repo_url,
        createdAt: row.created_at,
      }));

      return { success: true as const, results, total: results.length, timing: 0 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("searchMemoriesBySessionID: error", { error: errorMessage });
      return { success: false as const, error: errorMessage, results: [], total: 0, timing: 0 };
    }
  }
}

export const memoryClient = new LocalMemoryClient();
