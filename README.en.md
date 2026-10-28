# opencode-mem — Paper & Ink Custom Fork

[简体中文](README.md)

> A Yulimfish custom fork based on [tickernelz/opencode-mem](https://github.com/tickernelz/opencode-mem) v2.26.0.
> Retains all upstream features, ports the memory evolution system (P1/P2) at the source level, and redesigns the WebUI in the Paper & Ink visual style.

## What is this?

A plugin that provides persistent memory for OpenCode coding agents. It uses local Turso/libSQL vector search and requires no external database.

**Enhancements in this fork compared with upstream:**

| Feature | Description |
| --- | --- |
| Memory staging (P1) | New memories can be marked `staged` and excluded from retrieval/injection until reviewed and approved in the WebUI. |
| Soft invalidation (P1) | Historical memories after merges/conflicts retain their original text and vectors; retrieval excludes them without physically deleting them. |
| Memory merging (P1) | The `POST /api/memories/merge` endpoint merges multiple memories into one and soft-invalidates the originals. |
| Evidence-chain fields (P1) | `source` / `authority` / `observed_at` / `valid_until`, reserved for grading memory credibility. |
| Session capture fix (P1) | Per-session idle debouncing and capture locks fix missed captures caused by concurrent sessions overwriting one another; subagent sessions skip capture. |
| Outcome tagging (P1) | Summaries from automatic capture support `success` / `rework` / `corrected` / `none` outcome tags. |
| Hybrid retrieval injection (P2) | Composite scoring across relevance, recency, authority, and injection frequency, plus MMR diversity selection and token-budget truncation. |
| Paper & Ink WebUI | A visual style with serif headings, paper texture, and warm-colored cards. |
| Graph page | A memory–prompt relationship graph with search, filtering, and a detail panel. |

## Working with the OpenChamber extension

This project is the memory system itself: it handles memory storage, capture, retrieval, and injection, and provides a standalone WebUI as a complete management console. If you use OpenChamber, you can also install the companion [openchamber-memory-graph-ui](https://github.com/yulimfish/openchamber-memory-graph-ui). It provides browsing, search, management, and graph entry points inside OpenChamber through a restricted local API; it does not create another memory store or replace this plugin's core logic. Both interfaces connect to the same memory data and can be used separately or together, depending on your workflow.

## Installation

Install through `opencode-workflow-kit` (recommended):

```bash
bash install.sh
```

Or install manually:

```bash
npm install "github:Yulimfish/opencode-mem#yulimfish/paper-ink"
```

Then specify the plugin entry point in `opencode.jsonc`:

```jsonc
{
  "plugin": ["./node_modules/@yulimfish/opencode-mem/dist/plugin.js"],
}
```

## Configuration

The configuration file is located at `~/.config/opencode/opencode-mem.jsonc` (a template is generated automatically on first startup).

**At least one AI provider must be configured** (for automatic capture and user profile learning):

```jsonc
{
  // Recommended: use a provider already authenticated in OpenCode
  "opencodeProvider": "anthropic",
  "opencodeModel": "claude-haiku-4-5-20251001",
}
```

Or configure one manually:

```jsonc
{
  "memoryProvider": "openai-chat",
  "memoryModel": "gpt-4o-mini",
  "memoryApiUrl": "https://api.openai.com/v1",
  "memoryApiKey": "sk-...",
}
```

**Retrieval configuration added by this fork (optional):**

```jsonc
{
  "retrieval": {
    "gateEnabled": true, // Enable injection gating
    "candidates": 20, // Number of hybrid retrieval candidates
    "minScore": 0.3, // Minimum similarity threshold
    "injectionTokenBudget": 2048, // Injection token budget
    "injectProfileTokenBudget": 1024, // Profile injection token budget
  },
}
```

See the configuration template or the upstream [README](https://github.com/tickernelz/opencode-mem#configuration) for the full list of configuration options.

## Data migration warning

When upgrading from v2.19.4 or earlier to this fork (based on v2.26.0), **the storage format migrates from SQLite + USearch to Turso/libSQL**.

- Migration runs automatically on first startup; the original data is backed up as `.legacy.bak`.
- **Strongly recommended: manually back up the `~/.opencode-mem/data/` directory before migrating.**
- P1 staging, soft-invalidation, and injection-count fields are preserved during migration.

## Development

```bash
# Install dependencies (root directory + web directory)
bun install && cd web && bun install && cd ..

# Build (TypeScript + Vite frontend)
bun run build

# Tests
bun test

# Type check
bun run typecheck

# Frontend development server
bun run web:dev
```

## Keeping up with upstream

This fork is based on the `v2.26.0` tag of `tickernelz/opencode-mem`. When upgrading upstream:

1. Merge the new upstream version on a new branch.
2. Resolve conflicts in `src/services/turso/` and `src/index.ts` (the P1/P2 logic is in these files).
3. Check whether `web/src/` has new pages that need to be adapted to the Paper & Ink style.
4. Verify with `bun run typecheck && bun test && bun run build`.
5. P1/P2 have been ported to the TypeScript source and no longer depend on replaying `dist` patches.

The old v2.19.4 `dist` patches are kept in the `patches/` directory for historical reference only and are not part of the build.

## License

MIT — same as upstream.

## Acknowledgments

- Upstream project: [tickernelz/opencode-mem](https://github.com/tickernelz/opencode-mem)
- Installation tool: [Yulimfish/opencode-workflow-kit](https://github.com/Yulimfish/opencode-workflow-kit)
