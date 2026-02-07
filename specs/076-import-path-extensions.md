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

Complete. Re-verification 2026-02-07 (PROMPT_build execute one spec, re-verify 076): all 5 AC confirmed ($/ with .ts/.svelte/.svelte.ts; relative with extensions; constants/TS inline (await import).default; components top-level asset imports; no path helpers/remote; tsconfig allowImportingTsExtensions); test:unit 44 Deno + 159 Vitest passed. Previous: Re-verification 2026-02-07 (PROMPT_build execute one spec, re-verify 076—all specs complete): all 5 AC confirmed ($/ with .ts/.svelte/.svelte.ts; relative with extensions; constants/TS inline (await import).default; components top-level asset imports; no path helpers/remote; tsconfig allowImportingTsExtensions); test:unit 44 Deno + 159 Vitest passed. Previous: Re-verification 2026-02-07 (PROMPT_build execute one spec, re-verify mode—no incomplete specs): all 5 AC confirmed; test:unit 44 Deno + 159 Vitest passed. Previous: Re-verification 2026-02-07 (PROMPT_build execute one spec; re-verify 076, no incomplete specs): all 5 AC confirmed ($/ with .ts/.svelte/.svelte.ts/.svg/?url; relative with extensions; constants/TS inline (await import).default; components top-level asset imports; no path helpers/remote; tsconfig allowImportingTsExtensions). test:unit 44 Deno + 159 Vitest passed. Previous: Re-verification 2026-02-07 (PROMPT_build execute one spec, re-verify 076): fixed 3 imports of Draggable—EntityId.svelte, CoinAmount.svelte, intentDraggable.svelte.ts now use `$/components/Draggable.svelte.ts`. All 5 AC confirmed; test:unit 44 Deno + 159 Vitest passed. Previous: Re-verification 2026-02-07 (PROMPT_build execute one spec, re-verify mode—all specs complete): all 5 AC re-confirmed ($/ with .ts/.svelte/.svelte.ts/.svg/?url; relative with extensions; constants/TS inline (await import).default; components top-level asset imports; no path helpers/remote for bundled assets; tsconfig allowImportingTsExtensions). test:unit 44 Deno + 159 Vitest passed. Previous: Re-verification 2026-02-07 (PROMPT_build execute one spec, re-verify 076): all 5 AC confirmed. Fixed $/ imports for .svelte.ts modules (live-query-context, yellow, intentDraggable, bridge-settings, liquidity-settings, swap-settings, room, wallet, intent-drag-preview, intent-navigation, toast)—now use full extension .svelte.ts. $/ imports use .ts/.svelte/.svelte.ts/.svg/?url; relative imports use explicit extensions; constants/TS use inline (await import('$/assets/...')).default; components use top-level asset imports; no path builder helpers or remote asset URLs; tsconfig allowImportingTsExtensions: true. test:unit 44 Deno + 159 Vitest passed. Re-verification 2026-02-07 (PROMPT_build execute one spec, all specs complete): re-verified 076; all 5 AC confirmed; test:unit 44 Deno + 159 Vitest passed. Previous: Audited: all `$/` imports in `**/*.{ts,svelte}` use `.ts`, `.svelte`, or `.svg`/`?url`; relative imports use explicit extensions; `src/constants/networks.ts` and `src/routes/about/architecture-graph.ts` use inline `(await import('$/assets/...')).default`; Svelte components (e.g. `+layout.svelte`) use top-level asset imports; no path builder helpers or remote asset URLs. tsconfig has `allowImportingTsExtensions: true`. test:unit passed.
