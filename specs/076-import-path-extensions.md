# Spec 076: Import path extensions and asset imports

Mandate file extensions on import paths and consistent asset import style. Applies to `**/*.{ts,svelte}`.

## Scope

- All `$/` and relative imports include the correct file extension.
- Asset imports: constants/TS modules use inline `(await import()).default`; Svelte components use regular static imports.
- tsconfig uses `allowImportingTsExtensions: true`; the bundler resolves these paths.

## Rules

- **`$/` alias:** Always include the file extension: `.ts` for TypeScript/JS modules, `.svelte` for Svelte components, `.svg` (or `?url`) for assets. Example: `from '$/constants/intents.ts'`, `from '$/views/Navigation.svelte'`.
- **Relative imports:** Prefer explicit extensions (`.ts`, `.svelte`) for consistency and tooling.
- **Assets:** In constants and other TS modules use inline `(await import('$/assets/...')).default` at the use site. In Svelte components use regular `import x from '$/assets/...'` (e.g. `import iconEth from '$/assets/coins/eth.svg?url'`). Group asset imports with the Components section in Svelte files.

## Acceptance criteria

- [x] Every `$/` import includes the correct extension (`.ts`, `.svelte`, or asset with `.svg` / `?url`).
- [x] Relative imports use explicit extensions where applicable.
- [x] Constants/TS modules that reference assets use inline `(await import('$/assets/...')).default`.
- [x] Components that reference assets use top-level `import x from '$/assets/...'`.
- [x] No path builder helpers or remote asset URLs for bundled icons/assets.

## Status

Complete. Re-verification 2026-02-07 (PROMPT_build execute one spec, all specs complete; re-verify 076): all 5 AC confirmed—$/ imports use .ts/.svelte/.svg/?url; relative imports use explicit extensions; constants/TS (networks.ts, architecture-graph.ts, intents.ts, coin-icon.ts) use inline (await import('$/assets/...')).default; components use top-level asset imports; no path builder helpers or remote asset URLs; tsconfig allowImportingTsExtensions: true. test:unit 44 Deno + 159 Vitest passed. Re-verification 2026-02-07 (PROMPT_build execute one spec, all specs complete): re-verified 076; all 5 AC confirmed; test:unit 44 Deno + 159 Vitest passed. Previous: Audited: all `$/` imports in `**/*.{ts,svelte}` use `.ts`, `.svelte`, or `.svg`/`?url`; relative imports use explicit extensions; `src/constants/networks.ts` and `src/routes/about/architecture-graph.ts` use inline `(await import('$/assets/...')).default`; Svelte components (e.g. `+layout.svelte`) use top-level asset imports; no path builder helpers or remote asset URLs. tsconfig has `allowImportingTsExtensions: true`. test:unit passed.
