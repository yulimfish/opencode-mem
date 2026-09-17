import { existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync, } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG } from "../config.js";
import { MemoryExportDocumentSchema, PORTABILITY_SCHEMA_VERSION, } from "../shared/api/portability-schemas.js";
import { extractScopeFromContainerTag } from "./memory-scope.js";
import { getProjectTagInfo } from "./tags.js";
import { embeddingService } from "./embedding.js";
import { ensureTursoReady } from "./turso/ready.js";
import { acquireTursoOperationLock } from "./turso/operation-lock.js";
import { tursoShardManager } from "./turso/shard-manager.js";
import { tursoConnectionManager } from "./turso/connection-manager.js";
import { tursoVectorSearch } from "./turso/vector-search.js";
import { formatTagsForEmbedding } from "./turso/vector-utils.js";
import { stripPrivateContent, isFullyPrivate } from "./privacy.js";
import { log } from "./logger.js";
function getPluginVersion() {
    try {
        const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "../../package.json");
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        return pkg.version ?? "unknown";
    }
    catch {
        return "unknown";
    }
}
const MAX_IMPORT_BYTES = 100 * 1024 * 1024;
function parseMetadata(value) {
    if (!value || typeof value !== "string")
        return undefined;
    try {
        return JSON.parse(value);
    }
    catch {
        return undefined;
    }
}
function parseTags(value) {
    if (!value || typeof value !== "string")
        return undefined;
    const tags = value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    return tags.length > 0 ? tags : undefined;
}
function rowToExportedMemory(row) {
    const content = stripPrivateContent(String(row.content ?? ""));
    if (!content.trim() || isFullyPrivate(String(row.content ?? ""))) {
        return null;
    }
    return {
        id: String(row.id),
        content,
        type: row.type ? String(row.type) : undefined,
        tags: parseTags(row.tags),
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at ?? row.created_at),
        isPinned: Number(row.is_pinned ?? 0) === 1,
        isStaged: Number(row.is_staged ?? 0) === 1,
        source: row.source ? String(row.source) : undefined,
        authority: row.authority ? String(row.authority) : undefined,
        observedAt: row.observed_at != null ? Number(row.observed_at) : undefined,
        validUntil: row.valid_until != null ? Number(row.valid_until) : undefined,
        injectCount: row.inject_count != null ? Number(row.inject_count) : undefined,
        lastInjectedAt: row.last_injected_at != null ? Number(row.last_injected_at) : undefined,
        metadata: parseMetadata(row.metadata),
        displayName: row.display_name ? String(row.display_name) : undefined,
        userName: row.user_name ? String(row.user_name) : undefined,
        userEmail: row.user_email ? String(row.user_email) : undefined,
        projectPath: row.project_path ? String(row.project_path) : undefined,
        projectName: row.project_name ? String(row.project_name) : undefined,
        gitRepoUrl: row.git_repo_url ? String(row.git_repo_url) : undefined,
    };
}
export class MemoryPortabilityService {
    async exportMemories(options) {
        await ensureTursoReady();
        const outputPath = resolve(options.outputPath);
        const project = getProjectTagInfo(options.currentDirectory);
        const { hash: scopeHash } = extractScopeFromContainerTag(project.tag);
        const shards = await tursoShardManager.getAllShards("project", scopeHash);
        const memories = [];
        for (const shard of shards) {
            if (!existsSync(shard.dbPath))
                continue;
            const db = await tursoConnectionManager.getConnection(shard.dbPath);
            const rows = await tursoVectorSearch.getAllMemories(db);
            for (const row of rows) {
                const exported = rowToExportedMemory(row);
                if (exported)
                    memories.push(exported);
            }
        }
        memories.sort((a, b) => b.createdAt - a.createdAt);
        const document = {
            schemaVersion: PORTABILITY_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            plugin: {
                package: "opencode-mem",
                version: getPluginVersion(),
            },
            source: {
                containerTag: project.tag,
                scope: "project",
                scopeHash,
                projectPath: project.projectPath,
                projectName: project.projectName,
                gitRepoUrl: project.gitRepoUrl,
            },
            embedding: {
                model: CONFIG.embeddingModel,
                dimensions: CONFIG.embeddingDimensions,
            },
            memories,
        };
        // Validate before writing so we never emit invalid documents.
        MemoryExportDocumentSchema.parse(document);
        mkdirSync(dirname(outputPath), { recursive: true });
        const tmpPath = `${outputPath}.tmp-${process.pid}-${Date.now()}`;
        try {
            writeFileSync(tmpPath, JSON.stringify(document, null, 2), "utf-8");
            renameSync(tmpPath, outputPath);
        }
        catch (error) {
            if (existsSync(tmpPath)) {
                try {
                    unlinkSync(tmpPath);
                }
                catch {
                    // ignore cleanup errors
                }
            }
            throw error;
        }
        return {
            success: true,
            outputPath,
            count: memories.length,
            containerTag: project.tag,
            scopeHash,
        };
    }
    async importMemories(options) {
        await ensureTursoReady();
        await embeddingService.warmup();
        const inputPath = resolve(options.inputPath);
        if (!existsSync(inputPath)) {
            return {
                success: false,
                dryRun: Boolean(options.dryRun),
                error: `Import file not found: ${inputPath}`,
            };
        }
        if (statSync(inputPath).size > MAX_IMPORT_BYTES) {
            return {
                success: false,
                dryRun: Boolean(options.dryRun),
                error: `Import file exceeds ${MAX_IMPORT_BYTES} byte limit`,
            };
        }
        let parsed;
        try {
            parsed = JSON.parse(readFileSync(inputPath, "utf-8"));
        }
        catch (error) {
            return {
                success: false,
                dryRun: Boolean(options.dryRun),
                error: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
        if (parsed &&
            typeof parsed === "object" &&
            "schemaVersion" in parsed &&
            typeof parsed.schemaVersion === "number" &&
            parsed.schemaVersion > PORTABILITY_SCHEMA_VERSION) {
            return {
                success: false,
                dryRun: Boolean(options.dryRun),
                error: `Unsupported export schemaVersion ${parsed.schemaVersion}. Upgrade opencode-mem to import this file.`,
            };
        }
        const validated = MemoryExportDocumentSchema.safeParse(parsed);
        if (!validated.success) {
            return {
                success: false,
                dryRun: Boolean(options.dryRun),
                error: `Invalid export document: ${validated.error.issues.map((issue) => issue.message).join("; ")}`,
            };
        }
        const document = validated.data;
        const target = getProjectTagInfo(options.currentDirectory);
        const { scope, hash } = extractScopeFromContainerTag(target.tag);
        // Pre-scan for ID conflicts across all project shards of the target.
        const targetShards = await tursoShardManager.getAllShards(scope, hash);
        const rejected = [];
        const skipped = [];
        for (const memory of document.memories) {
            for (const shard of targetShards) {
                if (!existsSync(shard.dbPath))
                    continue;
                const db = await tursoConnectionManager.getConnection(shard.dbPath);
                const existing = await tursoVectorSearch.getMemoryById(db, memory.id);
                if (existing) {
                    rejected.push({
                        id: memory.id,
                        reason: "memory id already exists in target project",
                    });
                    break;
                }
            }
        }
        if (rejected.length > 0) {
            return {
                success: false,
                dryRun: Boolean(options.dryRun),
                imported: 0,
                rejected,
                containerTag: target.tag,
                error: `Import aborted: ${rejected.length} memory id(s) already exist in the target project`,
            };
        }
        if (options.dryRun) {
            return {
                success: true,
                dryRun: true,
                imported: document.memories.length,
                skipped,
                rejected,
                containerTag: target.tag,
            };
        }
        const releaseLock = acquireTursoOperationLock("memory-import");
        const insertedIds = [];
        try {
            // Phase A: compute all embeddings before any DB write.
            const prepared = [];
            for (const memory of document.memories) {
                const tags = memory.tags ?? [];
                const vector = await embeddingService.embedWithTimeout(memory.content, {
                    task: "document",
                });
                const tagsVector = tags.length > 0
                    ? await embeddingService.embedWithTimeout(formatTagsForEmbedding(tags), {
                        task: "document",
                    })
                    : undefined;
                const metadata = {
                    ...(memory.metadata ?? {}),
                    source: "import",
                    importedAt: Date.now(),
                    exportSchemaVersion: document.schemaVersion,
                    originalContainerTag: document.source.containerTag,
                    originalProjectPath: document.source.projectPath,
                };
                prepared.push({
                    record: {
                        id: memory.id,
                        content: memory.content,
                        vector,
                        tagsVector,
                        containerTag: target.tag,
                        tags: tags.length > 0 ? tags.join(",") : undefined,
                        type: memory.type,
                        createdAt: memory.createdAt,
                        updatedAt: memory.updatedAt ?? memory.createdAt,
                        metadata: JSON.stringify(metadata),
                        displayName: target.displayName,
                        userName: memory.userName,
                        userEmail: memory.userEmail,
                        projectPath: target.projectPath,
                        projectName: target.projectName,
                        gitRepoUrl: target.gitRepoUrl,
                        isStaged: Boolean(memory.isStaged),
                        source: memory.source,
                        authority: memory.authority,
                        observedAt: memory.observedAt,
                        validUntil: memory.validUntil ?? 0,
                        injectCount: memory.injectCount ?? 0,
                        lastInjectedAt: memory.lastInjectedAt,
                    },
                    isPinned: Boolean(memory.isPinned),
                });
            }
            // Phase B: single transactional write. Avoid getWriteShard() here because it
            // refuses writes while our own operation lock is held.
            await tursoShardManager.withScopeWriteLock(scope, hash, async () => {
                let shard = await tursoShardManager.getActiveShard(scope, hash);
                if (!shard) {
                    shard = await tursoShardManager.createShard(scope, hash, 0);
                }
                const db = await tursoConnectionManager.getConnection(shard.dbPath);
                await db.transaction("write", async (tx) => {
                    for (const item of prepared) {
                        await tursoVectorSearch.insertVectorInTransaction(tx, item.record);
                        if (item.isPinned) {
                            await tx.execute({
                                sql: `UPDATE memories SET is_pinned = 1 WHERE id = ?`,
                                args: [item.record.id],
                            });
                        }
                        insertedIds.push(item.record.id);
                    }
                });
                await tursoShardManager.setVectorCount(shard.id, await tursoVectorSearch.countAllVectors(db));
            });
            log("Memory import completed", {
                imported: insertedIds.length,
                containerTag: target.tag,
            });
            return {
                success: true,
                dryRun: false,
                imported: insertedIds.length,
                skipped,
                rejected,
                containerTag: target.tag,
            };
        }
        catch (error) {
            // Best-effort cleanup if a partial insert somehow escaped the transaction.
            if (insertedIds.length > 0) {
                try {
                    const shards = await tursoShardManager.getAllShards(scope, hash);
                    for (const shard of shards) {
                        const db = await tursoConnectionManager.getConnection(shard.dbPath);
                        for (const id of insertedIds) {
                            const existing = await tursoVectorSearch.getMemoryById(db, id);
                            if (existing) {
                                await tursoVectorSearch.deleteVector(db, id);
                            }
                        }
                        await tursoShardManager.setVectorCount(shard.id, await tursoVectorSearch.countAllVectors(db));
                    }
                }
                catch (cleanupError) {
                    log("Memory import cleanup failed", { error: String(cleanupError) });
                }
            }
            return {
                success: false,
                dryRun: false,
                imported: 0,
                error: error instanceof Error ? error.message : String(error),
                containerTag: target.tag,
            };
        }
        finally {
            releaseLock();
        }
    }
}
export const memoryPortabilityService = new MemoryPortabilityService();
