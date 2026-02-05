# Spec 043: Deno as primary runtime

Use Deno instead of npm, pnpm, or bun for running scripts, tasks, and installing dependencies.

## Scope

- Define Deno as the preferred way to run dev, build, test, and one-off scripts.
- Dependencies are declared in `deno.json` (import map / npm specifiers) and installed via `deno install` or `deno cache`.
- Use `deno task`, `deno run`, or `deno test` rather than `npm run`, `pnpx`, `npx`, or `bun` when invoking project tooling.

## Non-goals

- Do not remove `package.json` / `pnpm-lock.yaml` if still required by Vite, SvelteKit, or other tooling that expects Node.
- Do not rewrite application runtime to Deno; the app can remain a Vite/SvelteKit app run via `deno task dev`.

## Acceptance criteria

- [x] All documented and scripted commands use Deno: `deno task <name>`, `deno run -A`, or `deno test -A` as appropriate.
- [x] New dependencies are added to `deno.json` imports (e.g. `"pkg": "npm:pkg"`) and cached with `deno cache` or `deno install`.
- [x] One-off or temporary scripts are run with `deno run -A` (or `deno task` if added to `deno.json` tasks); prefix temporary scripts with `_` per project convention.
- [x] Unit/spec tests that can run under Deno use `deno test -A`; e2e may still use Node/Playwright as needed.
- [x] README, AGENTS.md, or other contributor docs state that Deno is the primary way to run commands (with fallbacks only where necessary).

## Status

Complete. Deno-first commands; test:e2e uses playwright.e2e.config.ts (workers:1, webServer timeout 240s, TEVM env) for stable E2E runs via Node/Playwright. Re-verification 2026-02-05 (PROMPT_build execute one spec): all 5 AC re-verified (deno.json tasks/imports, README Deno usage); test:unit 41 Deno + 101 Vitest passed. Re-verification 2026-02-05 (PROMPT_build one spec): all 5 AC re-confirmed; test:unit passed. Re-verification 2026-02-05 (PROMPT_build.md execute one spec, no incomplete specs): re-verified 043; all 5 AC confirmed; test:unit 41 Deno + 101 Vitest passed.

## Output when complete

`DONE`
