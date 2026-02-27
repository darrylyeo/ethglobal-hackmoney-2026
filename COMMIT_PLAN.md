# Atomic commits — current changes

All modified + untracked in ethglobal-hackmoney-2026. Topological order; verify with `deno task check` after code commits.

## Plan

| # | Message | Files / hunks |
|---|---------|----------------|
| 1 | e2e: move support files to e2e/support/ | Add e2e/support/*.ts; update e2e/*.ts + coverage-structural-check.mjs imports; delete e2e/coverage-helpers.ts, coverage-manifest.ts, coverage-utils.ts, test-setup.ts |
| 2 | scripts: add sync/fork-schedules, remove obsolete paths and format task | Add scripts/sync/fork-schedules.ts; delete _generate-test-importmap, _svelte-section-spacing, _sync-assets, check-*.mjs, format/svelte-section-spacing.ts, sync-fork-schedules.ts; deno.json path updates + remove format; scripts/test/generate-importmap.ts path fix |
| 3 | deno: update lockfile | deno.lock |
| 4 | cursor: format rule — manual Svelte spacing only | .cursor/rules/format.mdc |
| 5 | specs: update paths and format docs | specs/045, 052, 056, 057, 075, 085, 110, 113 |
| 6 | src: formatting and type style (id-serializations, fuzzyMatch, CoinAmount) | src/constants/id-serializations.ts, src/lib/fuzzyMatch.ts, src/views/CoinAmount.svelte |
| 7 | docs: COMMIT_PLAN for script/e2e reorg and spec updates | COMMIT_PLAN.md |

## Completed (SHAs)

| # | SHA | Message |
|---|-----|---------|
| 1 | 5836b89 | e2e: move support files to e2e/support/ |
| 2 | 8990545 | scripts: add sync/fork-schedules, remove obsolete paths and format task |
| 3 | 52a40c8 | deno: update lockfile |
| 4 | 13519a3 | cursor: format rule — manual Svelte spacing only |
| 5 | 700e3d4 | specs: update paths and format docs (e2e/support, scripts, remove format task) |
| 6 | f489569 | src: formatting and type style (id-serializations, fuzzyMatch, CoinAmount) |
| 7 | be6860e | docs: COMMIT_PLAN for script/e2e reorg and spec updates |
