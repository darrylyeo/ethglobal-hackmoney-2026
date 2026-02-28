# Commit plan

## ethglobal-hackmoney-2026

**Single formatting pass:** one attribute/prop per line in Svelte markup (no logic or import changes).

- **Commit 1** — `style: one attribute per line in Svelte markup`
  - All modified .svelte files under `src/` (components, lib/reorder, routes, views) + `COMMIT_PLAN.md`
  - Topological order: N/A (formatting-only; no dependencies)

**Verify:** `deno task check` after commit.

## blockhead.vision-portfolio

- No staged or modified tracked files. Untracked left uncommitted: `.claude/settings.local.json`, `_download_1inch_specs.ts`, `_generate_1inch_types.ts`.
