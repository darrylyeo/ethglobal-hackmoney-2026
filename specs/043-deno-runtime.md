# Spec 043: Deno-exclusive runtime and packages

Use Deno exclusively for task running and package management. No bun, pnpm, or npm as runtimes; no lockfiles other than `deno.lock`.

## Scope

- All scripts, dev, build, test, and one-off tasks run via `deno task`, `deno run -A`, or `deno test -A`.
- Dependencies are declared in `deno.json` (import map / npm specifiers) and installed/cached with `deno install` or `deno cache`; the only lockfile is `deno.lock`.
- No references to `bun`, `pnpm`, `pnpx`, `npx`, or `npm run` in tasks, docs, or code comments (except historical `history/` files).
- Remove `bun.lock` and `pnpm-lock.yaml`; ignore them in `.gitignore` so they are not recreated.
- The `deno.json` import map entry `"bun:ffi": "./shims/bun-ffi.js"` is a Deno stub for `@tevm/voltaire` (which requests that specifier); it is not a bun runtime dependency.

## Non-goals

- Do not rewrite the app runtime to Deno; the app remains a Vite/SvelteKit app run via `deno task dev`. `package.json` may remain for Vite/SvelteKit metadata and tooling that reads it; installation and execution use Deno only.

## Acceptance criteria

- [x] All `deno.json` tasks use only `deno task`, `deno run -A`, or `deno test -A` (no `node`, `bun`, `pnpm`, `npx` in task commands).
- [x] New dependencies are added via `deno.json` imports (e.g. `"pkg": "npm:pkg"`) and cached with `deno cache` or `deno install`.
- [x] Only lockfile in the repo is `deno.lock`; `bun.lock` and `pnpm-lock.yaml` are deleted and listed in `.gitignore`.
- [x] README, AGENTS.md, and other contributor-facing docs describe only Deno commands (no bun/pnpm/npx).
- [x] Scripts and source comments do not mention running with bun or pnpm (legacy `history/` files unchanged).

## Status

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 043—comment fix): Fixed comment in e2e/coverage-structural-check.mjs (node → deno run -A). All 5 AC confirmed. Deno test 55 passed; test:e2e:structural runs with Deno; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 043): Fixed regression—task test:e2e:one-scenario used `node`; now `deno run -A e2e/run-one-scenario.mjs`; run-one-scenario.mjs uses npm:playwright and Deno.env/Deno.args/Deno.exit. All 5 AC confirmed. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 043 again): All 5 AC confirmed. Removed stray pnpm-lock.yaml (was on disk; only deno.lock is lockfile; bun.lock and pnpm-lock.yaml in .gitignore). deno.json tasks Deno-only; README/AGENTS.md Deno-only; scripts/src no bun/pnpm/npx. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 043): All 5 AC confirmed—deno.json tasks use only deno task/run/test; dependencies via deno.json; only deno.lock, bun.lock and pnpm-lock.yaml in .gitignore; README/AGENTS.md Deno-only; package.json scripts updated to Deno (removed packageManager, deploy:partykit→deno task, test:e2e→deno task, test:e2e:structural via deno run -A). Deno test 55 passed; test:e2e:structural runs with Deno. Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Deno-only tasks; format script ported to Deno (_svelte-section-spacing.ts); e2e via `deno run -A npm:@playwright/test`; lockfiles purged; .gitignore updated.

## Output when complete

`DONE`
