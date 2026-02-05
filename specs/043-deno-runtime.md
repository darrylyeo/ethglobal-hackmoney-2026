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

Complete. Deno-only tasks; format script ported to Deno (_svelte-section-spacing.ts); e2e via `deno run -A npm:@playwright/test`; lockfiles purged; .gitignore updated.

## Output when complete

`DONE`
