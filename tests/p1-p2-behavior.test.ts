import { describe, expect, it, afterEach } from "bun:test";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { cleanupTursoTestDirectory } from "./turso-test-utils.js";

describe("P1/P2 behavioral tests", () => {
  let baseDir: string;

  afterEach(async () => {
    await cleanupTursoTestDirectory(baseDir);
  });

  async function setup() {
    baseDir = mkdtempSync(join(tmpdir(), "p1-behavior-"));
    const { CONFIG } = await import("../src/config.js");
    CONFIG.storagePath = baseDir;
    CONFIG.embeddingDimensions = 768;
    const { closeTursoAndInvalidateCaches } = await import("../src/services/turso/lifecycle.js");
    await closeTursoAndInvalidateCaches();
    const { tursoShardManager } = await import("../src/services/turso/shard-manager.js");
    const { tursoConnectionManager } = await import("../src/services/turso/connection-manager.js");
    const { tursoVectorSearch } = await import("../src/services/turso/vector-search.js");
    return { tursoShardManager, tursoConnectionManager, tursoVectorSearch, CONFIG };
  }

  function makeVector(dim = 768): Float32Array {
    const v = new Float32Array(dim);
    v[0] = 1;
    return v;
  }

  it("RETRIEVABLE_SQL: staged rows excluded from search hydration", async () => {
    const { tursoShardManager, tursoConnectionManager, tursoVectorSearch } = await setup();
    const hash = "a1b2c3d4e5f60789";
    const tag = `opencode_project_${hash}`;
    const shard = await tursoShardManager.createShard("project", hash, 0);
    const db = await tursoConnectionManager.getConnection(shard.dbPath);
    const now = Date.now();
    const vector = makeVector();

    await tursoVectorSearch.insertVector(db, {
      id: "mem_active",
      content: "active memory",
      vector,
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
    });
    await tursoVectorSearch.insertVector(db, {
      id: "mem_staged",
      content: "staged memory",
      vector,
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
      isStaged: true,
    });
    await tursoVectorSearch.insertVector(db, {
      id: "mem_invalid",
      content: "invalidated memory",
      vector,
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
      validUntil: now,
    });

    const results = await tursoVectorSearch.searchInShard(shard, vector, tag, 10);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("mem_active");
    expect(ids).not.toContain("mem_staged");
    expect(ids).not.toContain("mem_invalid");
  });

  it("listMemories default excludes staged/invalidated; includeNonRetrievable includes them", async () => {
    const { tursoShardManager, tursoConnectionManager, tursoVectorSearch } = await setup();
    const hash = "b2c3d4e5f6078901";
    const tag = `opencode_project_${hash}`;
    const shard = await tursoShardManager.createShard("project", hash, 0);
    const db = await tursoConnectionManager.getConnection(shard.dbPath);
    const now = Date.now();
    const vector = makeVector();

    await tursoVectorSearch.insertVector(db, {
      id: "mem_ok",
      content: "ok",
      vector,
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
    });
    await tursoVectorSearch.insertVector(db, {
      id: "mem_staged",
      content: "staged",
      vector,
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
      isStaged: true,
    });

    const filtered = await tursoVectorSearch.listMemories(db, tag, 100);
    expect(filtered.some((r: any) => r.id === "mem_ok")).toBe(true);
    expect(filtered.some((r: any) => r.id === "mem_staged")).toBe(false);

    const unfiltered = await tursoVectorSearch.listMemories(db, tag, 100, {
      includeNonRetrievable: true,
    });
    expect(unfiltered.some((r: any) => r.id === "mem_ok")).toBe(true);
    expect(unfiltered.some((r: any) => r.id === "mem_staged")).toBe(true);
  });

  it("updateMemoryState sets isStaged and validUntil correctly", async () => {
    const { tursoShardManager, tursoConnectionManager, tursoVectorSearch } = await setup();
    const hash = "c3d4e5f607890123";
    const tag = `opencode_project_${hash}`;
    const shard = await tursoShardManager.createShard("project", hash, 0);
    const db = await tursoConnectionManager.getConnection(shard.dbPath);
    const now = Date.now();

    await tursoVectorSearch.insertVector(db, {
      id: "mem_update",
      content: "test",
      vector: makeVector(),
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
    });

    await tursoVectorSearch.updateMemoryState(db, "mem_update", { isStaged: true });
    let row = await tursoVectorSearch.getMemoryById(db, "mem_update");
    expect(Number(row?.is_staged)).toBe(1);

    await tursoVectorSearch.updateMemoryState(db, "mem_update", {
      isStaged: false,
      validUntil: now,
    });
    row = await tursoVectorSearch.getMemoryById(db, "mem_update");
    expect(Number(row?.is_staged)).toBe(0);
    expect(Number(row?.valid_until)).toBe(now);
  });

  it("recordInjection increments inject_count and sets last_injected_at", async () => {
    const { tursoShardManager, tursoConnectionManager, tursoVectorSearch } = await setup();
    const hash = "d4e5f60789012345";
    const tag = `opencode_project_${hash}`;
    const shard = await tursoShardManager.createShard("project", hash, 0);
    const db = await tursoConnectionManager.getConnection(shard.dbPath);
    const now = Date.now();

    await tursoVectorSearch.insertVector(db, {
      id: "mem_inject",
      content: "test",
      vector: makeVector(),
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
    });

    expect(Number((await tursoVectorSearch.getMemoryById(db, "mem_inject"))?.inject_count)).toBe(0);

    await tursoVectorSearch.recordInjection(db, "mem_inject");
    const row = await tursoVectorSearch.getMemoryById(db, "mem_inject");
    expect(Number(row?.inject_count)).toBe(1);
    expect(Number(row?.last_injected_at)).toBeGreaterThan(0);
  });

  it("searchInShard result includes authority/injectCount/lastInjectedAt", async () => {
    const { tursoShardManager, tursoConnectionManager, tursoVectorSearch } = await setup();
    const hash = "e5f6078901234567";
    const tag = `opencode_project_${hash}`;
    const shard = await tursoShardManager.createShard("project", hash, 0);
    const db = await tursoConnectionManager.getConnection(shard.dbPath);
    const now = Date.now();
    const vector = makeVector();

    await tursoVectorSearch.insertVector(db, {
      id: "mem_signals",
      content: "test signals",
      vector,
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
      authority: "user-stated",
    });
    await tursoVectorSearch.recordInjection(db, "mem_signals");

    const results = await tursoVectorSearch.searchInShard(shard, vector, tag, 10);
    const hit = results.find((r) => r.id === "mem_signals");
    expect(hit).toBeDefined();
    expect(hit!.authority).toBe("user-stated");
    expect(hit!.injectCount).toBe(1);
    expect(hit!.lastInjectedAt).toBeGreaterThan(0);
  });

  it("handleApproveMemory(approve=true) unstages and soft-invalidates mergedFrom originals", async () => {
    const { tursoShardManager, tursoConnectionManager, tursoVectorSearch } = await setup();
    const hash = "f607890123456789";
    const tag = `opencode_project_${hash}`;
    const shard = await tursoShardManager.createShard("project", hash, 0);
    const db = await tursoConnectionManager.getConnection(shard.dbPath);
    const now = Date.now();
    const vector = makeVector();

    await tursoVectorSearch.insertVector(db, {
      id: "mem_orig_a",
      content: "original a",
      vector,
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
    });
    await tursoVectorSearch.insertVector(db, {
      id: "mem_orig_b",
      content: "original b",
      vector,
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
    });
    await tursoVectorSearch.insertVector(db, {
      id: "mem_merged",
      content: "merged result",
      vector,
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
      isStaged: true,
      metadata: JSON.stringify({ mergedFrom: ["mem_orig_a", "mem_orig_b"] }),
    });

    const { handleApproveMemory } = await import("../src/services/api-handlers.js");
    const result = await handleApproveMemory("mem_merged", true);
    expect(result.success).toBe(true);

    const merged = await tursoVectorSearch.getMemoryById(db, "mem_merged");
    expect(Number(merged?.is_staged)).toBe(0);

    const origA = await tursoVectorSearch.getMemoryById(db, "mem_orig_a");
    expect(Number(origA?.valid_until)).toBeGreaterThan(0);

    const origB = await tursoVectorSearch.getMemoryById(db, "mem_orig_b");
    expect(Number(origB?.valid_until)).toBeGreaterThan(0);
  });

  it("handleApproveMemory(approve=false) stages a memory", async () => {
    const { tursoShardManager, tursoConnectionManager, tursoVectorSearch } = await setup();
    const hash = "07890123456789ab";
    const tag = `opencode_project_${hash}`;
    const shard = await tursoShardManager.createShard("project", hash, 0);
    const db = await tursoConnectionManager.getConnection(shard.dbPath);
    const now = Date.now();

    await tursoVectorSearch.insertVector(db, {
      id: "mem_to_stage",
      content: "test",
      vector: makeVector(),
      containerTag: tag,
      createdAt: now,
      updatedAt: now,
    });

    const { handleApproveMemory } = await import("../src/services/api-handlers.js");
    const result = await handleApproveMemory("mem_to_stage", false);
    expect(result.success).toBe(true);

    const row = await tursoVectorSearch.getMemoryById(db, "mem_to_stage");
    expect(Number(row?.is_staged)).toBe(1);
  });

  it("hybrid-search rankAndSelect filters by gate and respects token budget", async () => {
    const { rankAndSelect } = await import("../src/services/hybrid-search.js");
    const now = Date.now();

    const candidates = [
      { id: "high", memory: "relevant memory", similarity: 0.9, createdAt: now, tags: ["a"] },
      { id: "low", memory: "irrelevant", similarity: 0.1, createdAt: now, tags: ["b"] },
    ];

    const config = {
      gateEnabled: true,
      candidates: 10,
      minScore: 0.3,
      injectionTokenBudget: 2048,
      injectProfileTokenBudget: 1024,
    };

    const selected = rankAndSelect(candidates, config, now);
    expect(selected.some((c) => c.id === "high")).toBe(true);
    expect(selected.some((c) => c.id === "low")).toBe(false);
  });

  it("hybrid-search rankAndSelect returns empty when gate filters all candidates", async () => {
    const { rankAndSelect } = await import("../src/services/hybrid-search.js");
    const now = Date.now();
    const candidates = [
      { id: "low", memory: "irrelevant", similarity: 0.1, createdAt: now, tags: [] },
    ];
    const config = {
      gateEnabled: true,
      candidates: 10,
      minScore: 0.5,
      injectionTokenBudget: 2048,
      injectProfileTokenBudget: 1024,
    };
    const selected = rankAndSelect(candidates, config, now);
    expect(selected).toHaveLength(0);
  });

  it("hybrid-search rankAndSelect respects token budget", async () => {
    const { rankAndSelect } = await import("../src/services/hybrid-search.js");
    const now = Date.now();
    const longText = "x".repeat(4000);
    const candidates = [
      { id: "big", memory: longText, similarity: 0.9, createdAt: now, tags: [] },
      { id: "small", memory: "short", similarity: 0.8, createdAt: now, tags: [] },
    ];
    const config = {
      gateEnabled: false,
      candidates: 10,
      minScore: 0,
      injectionTokenBudget: 100,
      injectProfileTokenBudget: 1024,
    };
    const selected = rankAndSelect(candidates, config, now);
    expect(selected.some((c) => c.id === "small")).toBe(true);
  });

  it("P1 DDL creates all 7 new columns on fresh shard", async () => {
    const { tursoShardManager, tursoConnectionManager } = await setup();
    const hash = "890123456789abcd";
    const shard = await tursoShardManager.createShard("project", hash, 0);
    const db = await tursoConnectionManager.getConnection(shard.dbPath);
    const rows = await db.all(`PRAGMA table_info(memories)`);
    const cols = new Set(rows.map((r: any) => String(r.name)));
    expect(cols.has("is_staged")).toBe(true);
    expect(cols.has("source")).toBe(true);
    expect(cols.has("authority")).toBe(true);
    expect(cols.has("observed_at")).toBe(true);
    expect(cols.has("valid_until")).toBe(true);
    expect(cols.has("inject_count")).toBe(true);
    expect(cols.has("last_injected_at")).toBe(true);
  });
});
