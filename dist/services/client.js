import { embeddingService } from "./embedding.js";
import { tursoShardManager } from "./turso/shard-manager.js";
import { tursoVectorSearch } from "./turso/vector-search.js";
import { tursoConnectionManager } from "./turso/connection-manager.js";
import { ensureTursoReady } from "./turso/ready.js";
import { formatTagsForEmbedding } from "./turso/vector-utils.js";
import { extractScopeFromContainerTag, resolveMemoryScope, } from "./memory-scope.js";
import { CONFIG } from "../config.js";
import { log } from "./logger.js";
function safeToISOString(timestamp) {
    try {
        if (timestamp === null || timestamp === undefined) {
            return new Date().toISOString();
        }
        const numValue = typeof timestamp === "bigint" ? Number(timestamp) : Number(timestamp);
        if (isNaN(numValue) || numValue < 0) {
            return new Date().toISOString();
        }
        return new Date(numValue).toISOString();
    }
    catch {
        return new Date().toISOString();
    }
}
function safeJSONParse(jsonString) {
    if (!jsonString || typeof jsonString !== "string") {
        return undefined;
    }
    try {
        return JSON.parse(jsonString);
    }
    catch {
        return undefined;
    }
}
function resolveScopeValue(scope, containerTag) {
    return resolveMemoryScope(scope, containerTag);
}
export class LocalMemoryClient {
    initPromise = null;
    isInitialized = false;
    constructor() { }
    async initialize() {
        if (this.isInitialized)
            return;
        if (this.initPromise)
            return this.initPromise;
        this.initPromise = (async () => {
            try {
                await ensureTursoReady();
                this.isInitialized = true;
            }
            catch (error) {
                this.initPromise = null;
                log("Turso initialization failed", { error: String(error) });
                throw error;
            }
        })();
        return this.initPromise;
    }
    async warmup(progressCallback) {
        await this.initialize();
        await embeddingService.warmup(progressCallback);
    }
    async isReady() {
        return this.isInitialized && embeddingService.isWarmedUp;
    }
    getEmbeddingInitError() {
        return embeddingService.initError;
    }
    getStatus() {
        return {
            dbConnected: this.isInitialized,
            modelLoaded: embeddingService.isWarmedUp,
            ready: this.isInitialized && embeddingService.isWarmedUp,
            embeddingError: embeddingService.initError,
        };
    }
    reset() {
        this.isInitialized = false;
        this.initPromise = null;
    }
    async close() {
        const { closeTursoAndInvalidateCaches } = await import("./turso/lifecycle.js");
        await closeTursoAndInvalidateCaches();
        this.reset();
    }
    async searchMemories(query, containerTag, scope = "project") {
        try {
            await this.initialize();
            const queryVector = await embeddingService.embedWithTimeout(query, { task: "query" });
            const resolved = resolveScopeValue(scope, containerTag);
            const shards = (await Promise.all(resolved.map((ref) => tursoShardManager.getAllShards(ref.scope, ref.hash)))).flat();
            if (shards.length === 0) {
                return { success: true, results: [], total: 0, timing: 0 };
            }
            const { results, warnings } = await tursoVectorSearch.searchAcrossShards(shards, queryVector, scope === "all-projects" ? "" : containerTag, CONFIG.maxMemories, CONFIG.similarityThreshold, query);
            return {
                success: true,
                results,
                total: results.length,
                timing: 0,
                ...(warnings.length > 0 ? { warnings } : {}),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log("searchMemories: error", { error: errorMessage });
            return { success: false, error: errorMessage, results: [], total: 0, timing: 0 };
        }
    }
    async addMemory(content, containerTag, metadata) {
        try {
            await this.initialize();
            const tags = metadata?.tags || [];
            const vector = await embeddingService.embedWithTimeout(content, { task: "document" });
            let tagsVector = undefined;
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
                const { displayName, userName, userEmail, projectPath, projectName, gitRepoUrl, type, tags: _tags, isStaged, authority, observedAt, source: sourceField, ...dynamicMetadata } = metadata || {};
                const record = {
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
                    source: sourceField || "api",
                    authority,
                    observedAt,
                    metadata: Object.keys(dynamicMetadata).length > 0 ? JSON.stringify(dynamicMetadata) : undefined,
                };
                const db = await tursoConnectionManager.getConnection(shard.dbPath);
                await tursoVectorSearch.insertVector(db, record);
                await tursoShardManager.incrementVectorCount(shard.id);
                return {
                    success: true,
                    id,
                };
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log("addMemory: error", { error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }
    async deleteMemory(memoryId) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log("deleteMemory: error", { memoryId, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }
    async listMemories(containerTag, limit = 20, scope = "project") {
        try {
            await this.initialize();
            const resolved = resolveScopeValue(scope, containerTag);
            const shards = (await Promise.all(resolved.map((ref) => tursoShardManager.getAllShards(ref.scope, ref.hash)))).flat();
            if (shards.length === 0) {
                return {
                    success: true,
                    memories: [],
                    pagination: { currentPage: 1, totalItems: 0, totalPages: 0 },
                };
            }
            const allMemories = [];
            for (const shard of shards) {
                const db = await tursoConnectionManager.getConnection(shard.dbPath);
                const memories = await tursoVectorSearch.listMemories(db, scope === "all-projects" ? "" : containerTag, limit);
                allMemories.push(...memories);
            }
            allMemories.sort((a, b) => Number(b.created_at) - Number(a.created_at));
            const memories = allMemories.slice(0, limit).map((r) => ({
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
            }));
            return {
                success: true,
                memories,
                pagination: { currentPage: 1, totalItems: memories.length, totalPages: 1 },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log("listMemories: error", { error: errorMessage });
            return {
                success: false,
                error: errorMessage,
                memories: [],
                pagination: { currentPage: 1, totalItems: 0, totalPages: 0 },
            };
        }
    }
    async ensureStorageReady() {
        await this.initialize();
    }
    /**
     * Merge multiple memories into one new entry, soft-invalidating originals.
     * All ids must exist and share the same shard. Staged merges are proposals:
     * originals are NOT invalidated until human approval.
     */
    async mergeMemories(ids, content, opts) {
        try {
            await this.initialize();
            if (!ids || ids.length < 2) {
                return { success: false, error: "mergeMemories requires at least 2 ids" };
            }
            // Locate all memories and verify they share a shard.
            const userShards = await tursoShardManager.getAllShards("user", "");
            const projectShards = await tursoShardManager.getAllShards("project", "");
            const allShards = [...userShards, ...projectShards];
            let targetShard = null;
            const found = [];
            for (const shard of allShards) {
                const db = await tursoConnectionManager.getConnection(shard.dbPath);
                for (const id of ids) {
                    const row = await tursoVectorSearch.getMemoryById(db, id);
                    if (row) {
                        if (!targetShard)
                            targetShard = shard;
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
            const tagSet = new Set();
            for (const f of found) {
                const tags = f.row.tags ? String(f.row.tags).split(",") : [];
                tags.forEach((t) => t.trim() && tagSet.add(t.trim()));
            }
            const mergedTags = Array.from(tagSet);
            const vector = await embeddingService.embedWithTimeout(content, { task: "document" });
            let tagsVector;
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
            const record = {
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
                            const args = [now, f.id];
                            await tx.execute({
                                sql: `UPDATE memories SET ${sets.join(", ")} WHERE id = ?`,
                                args,
                            });
                        }
                    }
                });
                await tursoShardManager.incrementVectorCount(targetShard.id);
                return {
                    success: true,
                    id,
                    mergedFrom: ids,
                };
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log("mergeMemories: error", { error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }
    async listShards(currentDirectory) {
        try {
            await this.initialize();
            const { shardInventoryService } = await import("./shard-inventory-service.js");
            return await shardInventoryService.listShards(currentDirectory);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log("listShards: error", { error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }
    async migrateProjectPath(options) {
        try {
            await this.initialize();
            const { shardPathMigrationService } = await import("./shard-path-migration-service.js");
            return await shardPathMigrationService.migrate(options);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log("migrateProjectPath: error", { error: errorMessage });
            return { success: false, dryRun: Boolean(options.dryRun), error: errorMessage };
        }
    }
    async exportMemories(currentDirectory, outputPath) {
        try {
            await this.initialize();
            const { memoryPortabilityService } = await import("./memory-portability-service.js");
            return await memoryPortabilityService.exportMemories({ currentDirectory, outputPath });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log("exportMemories: error", { error: errorMessage });
            return { success: false, error: errorMessage };
        }
    }
    async importMemories(currentDirectory, inputPath, dryRun) {
        try {
            await this.initialize();
            const { memoryPortabilityService } = await import("./memory-portability-service.js");
            return await memoryPortabilityService.importMemories({
                currentDirectory,
                inputPath,
                dryRun,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log("importMemories: error", { error: errorMessage });
            return { success: false, dryRun: Boolean(dryRun), error: errorMessage };
        }
    }
    async searchMemoriesBySessionID(sessionID, containerTag, limit = 10) {
        try {
            await this.initialize();
            const { scope, hash } = extractScopeFromContainerTag(containerTag);
            const shards = await tursoShardManager.getAllShards(scope, hash);
            if (shards.length === 0) {
                return { success: true, results: [], total: 0, timing: 0 };
            }
            const allMemories = [];
            for (const shard of shards) {
                const db = await tursoConnectionManager.getConnection(shard.dbPath);
                const memories = await tursoVectorSearch.getMemoriesBySessionID(db, sessionID);
                allMemories.push(...memories);
            }
            allMemories.sort((a, b) => Number(b.created_at) - Number(a.created_at));
            const results = allMemories.slice(0, limit).map((row) => ({
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
            return { success: true, results, total: results.length, timing: 0 };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log("searchMemoriesBySessionID: error", { error: errorMessage });
            return { success: false, error: errorMessage, results: [], total: 0, timing: 0 };
        }
    }
}
export const memoryClient = new LocalMemoryClient();
