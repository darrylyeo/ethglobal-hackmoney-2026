# Commit plan: spec 041 formatting + lockfile

## Phases (topological order)

1. **Spec doc** — Document the dangling `=` / `=>` rule so code changes are justified.
2. **Code** — Apply spec 041 formatting across Svelte/TS (and calldata-decoder markup fix).
3. **Lockfile** — deno.lock (dependency resolution only).

## Commits

| # | SHA | Message | Files |
|---|-----|---------|--------|
| 1 | 85fe43af | specs: 041 add dangling =/=> acceptance criterion | specs/041-svelte-ts-formatting.md |
| 2 | 99017536 | style: apply spec 041 Svelte/TS formatting | src/** (215 files) |
| 3 | 75db0c26 | deno: lockfile | deno.lock |

## Dependencies

- Spec first (documents the rule).
- Code second (no dependency on lockfile for build).
- Lockfile last.

## Verification

After each commit: `deno task check`.
