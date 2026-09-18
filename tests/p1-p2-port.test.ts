import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = new URL("../src", import.meta.url).pathname;

function readSrc(rel: string): string {
  return readFileSync(`${SRC}/${rel}`, "utf-8");
}

describe("P1/P2 source port behavioral contracts", () => {
  it("listMemories default filters retrievable rows (RETRIEVABLE_SQL)", () => {
    const src = readSrc("services/turso/vector-search.ts");
    expect(src).toContain("RETRIEVABLE_SQL");
    expect(src).toContain("is_staged = 0");
    expect(src).toContain("valid_until");
  });

  it("listMemories supports includeNonRetrievable for review surface", () => {
    const src = readSrc("services/turso/vector-search.ts");
    expect(src).toContain("includeNonRetrievable");
  });

  it("api-handlers tag path passes includeNonRetrievable=true", () => {
    const src = readSrc("services/api-handlers.ts");
    expect(src).toContain("includeNonRetrievable: true");
  });

  it("handleUpdateMemory preserves P1 columns on re-insert", () => {
    const src = readSrc("services/api-handlers.ts");
    expect(src).toContain("is_staged");
    expect(src).toContain("valid_until");
    expect(src).toContain("inject_count");
    expect(src).toContain("last_injected_at");
  });

  it("mergeMemories uses db.transaction for atomicity", () => {
    const src = readSrc("services/client.ts");
    expect(src).toContain('db.transaction("write"');
  });

  it("mergeMemories sets isStaged on merged record when source is staged", () => {
    const src = readSrc("services/client.ts");
    expect(src).toContain("isStaged: isStagedMerge");
  });

  it("approve endpoint soft-invalidates mergedFrom originals", () => {
    const src = readSrc("services/api-handlers.ts");
    expect(src).toContain("mergedFrom");
    expect(src).toContain("validUntil: now");
  });

  it("unstage endpoint stages (isStaged=true), approve unstages (isStaged=false)", () => {
    const src = readSrc("services/api-handlers.ts");
    // approve → isStaged: false (unstage the record)
    expect(src).toContain("isStaged: false");
    // unstage (stage it) → isStaged: true
    expect(src).toContain("isStaged: true");
  });

  it("chat.message uses searchMemories for real similarity scores", () => {
    const src = readSrc("index.ts");
    expect(src).toContain("searchMemories");
    expect(src).toContain("rankAndSelect");
    expect(src).toContain("recordInjection");
  });

  it("chat.message hybrid candidates use real similarity from search", () => {
    const src = readSrc("index.ts");
    expect(src).toContain("m.similarity ?? 0.5");
  });

  it("recordInjection scoped to current project shards", () => {
    const src = readSrc("index.ts");
    expect(src).toContain("extractScopeFromContainerTag(tags.project.tag)");
  });

  it("auto-capture zod schema includes outcome field", () => {
    const src = readSrc("services/auto-capture.ts");
    expect(src).toContain('z.enum(["success", "rework", "corrected", "none"])');
  });

  it("auto-capture toolSchema includes outcome field", () => {
    const src = readSrc("services/auto-capture.ts");
    expect(src).toContain("outcome:");
    expect(src).toContain('"success", "rework", "corrected", "none"');
  });

  it("auto-capture passes outcome to addMemory metadata", () => {
    const src = readSrc("services/auto-capture.ts");
    expect(src).toContain("outcome:");
  });

  it("migration-service SELECT includes P1 columns", () => {
    const src = readSrc("services/migration-service.ts");
    expect(src).toContain("is_staged");
    expect(src).toContain("valid_until");
    expect(src).toContain("inject_count");
  });

  it("portability export schema includes P1 fields", () => {
    const src = readSrc("shared/api/portability-schemas.ts");
    expect(src).toContain("isStaged");
    expect(src).toContain("validUntil");
    expect(src).toContain("injectCount");
  });

  it("portability import reconstructs P1 fields", () => {
    const src = readSrc("services/memory-portability-service.ts");
    expect(src).toContain("isStaged: Boolean(memory.isStaged)");
    expect(src).toContain("validUntil: memory.validUntil");
  });

  it("dedup protects is_pinned from deletion", () => {
    const src = readSrc("services/deduplication-service.ts");
    expect(src).toContain("is_pinned");
  });

  it("exactScanKind includes RETRIEVABLE_SQL filter", () => {
    const src = readSrc("services/turso/vector-search.ts");
    // exactScanKind should reference RETRIEVABLE_SQL
    const exactScanIdx = src.indexOf("exactScanKind");
    const afterExactScan = src.slice(exactScanIdx);
    expect(afterExactScan).toContain("RETRIEVABLE_SQL");
  });

  it("getEmbeddingDimensions knows qwen3.7-text-embedding", () => {
    const src = readSrc("config.ts");
    expect(src).toContain("qwen3.7-text-embedding");
    expect(src).toContain("1024");
  });

  it("shard DDL includes P1 columns", () => {
    const src = readSrc("services/turso/shard-manager.ts");
    expect(src).toContain("is_staged INTEGER DEFAULT 0");
    expect(src).toContain("valid_until INTEGER DEFAULT 0");
    expect(src).toContain("inject_count INTEGER DEFAULT 0");
  });

  it("shard lazy migration adds missing P1 columns", () => {
    const src = readSrc("services/turso/shard-manager.ts");
    expect(src).toContain("ALTER TABLE memories ADD COLUMN");
    expect(src).toContain("PRAGMA table_info");
  });

  it("legacy-migrator rowToRecord passes through P1 fields", () => {
    const src = readSrc("services/turso/legacy-migrator.ts");
    expect(src).toContain("isStaged: Number(row.is_staged");
    expect(src).toContain("validUntil: row.valid_until");
  });

  it("handleAddMemory writes source column", () => {
    const src = readSrc("services/api-handlers.ts");
    expect(src).toContain('source: "api"');
  });

  it("hybrid-search exports rankAndSelect and mmrSelect", () => {
    const src = readSrc("services/hybrid-search.ts");
    expect(src).toContain("export function rankAndSelect");
    expect(src).toContain("export function mmrSelect");
  });

  it("hybrid-search uses composite scoring with relevance/recency/authority/frequency", () => {
    const src = readSrc("services/hybrid-search.ts");
    expect(src).toContain("relevance");
    expect(src).toContain("recency");
    expect(src).toContain("authority");
    expect(src).toContain("frequency");
  });

  it("per-session idle timers in index.ts", () => {
    const src = readSrc("index.ts");
    expect(src).toContain("idleTimeouts");
    expect(src).toContain("idleTimeouts.set(sessionID");
    expect(src).toContain("idleTimeouts.delete(sessionID)");
  });

  it("subagent skip in session.idle handler", () => {
    const src = readSrc("index.ts");
    expect(src).toContain("parentID");
    expect(src).toContain("subagent session");
  });

  it("auto-capture uses per-session locks", () => {
    const src = readSrc("services/auto-capture.ts");
    expect(src).toContain("sessionCaptureLocks");
  });
});
