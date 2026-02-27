# Atomic commits — current changes

All modified + untracked in ethglobal-hackmoney-2026. Topological order; verify with `deno task check` after code commits.

## Plan

| # | Message | Files |
|---|---------|--------|
| 1 | specs: add 129 (entity view footer sources) | specs/129-entity-view-footer-sources.md |
| 2 | test: add asset-url stub for Deno ?url imports | src/test-stubs/asset-url.ts |
| 3 | scripts: add test importmap generator and unit spec list | scripts/_generate-test-importmap.ts, scripts/test/generate-importmap.ts, scripts/test/deno-unit-specs.txt |
| 4 | deno: test:unit use generated import map; ignore deno.test.importmap.json | .gitignore, deno.json |
| 5 | deno: lock JSR @std/assert, @std/internal | deno.lock |
| 6 | scripts: add cursor-agent-loop, format, assets sync, checks | scripts/cursor-agent-loop.sh, scripts/format/svelte-section-spacing.ts, scripts/assets/sync.ts, scripts/checks/*.mjs |
| 7 | cursor: add README-mcp | .cursor/README-mcp.md |
| 8 | docs: COMMIT_PLAN WithSource refactor | COMMIT_PLAN.md |

## Completed (SHAs)

(To be filled after commits.)
