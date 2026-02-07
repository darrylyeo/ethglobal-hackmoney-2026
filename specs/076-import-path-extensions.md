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

- [ ] Every `$/` import includes the correct extension (`.ts`, `.svelte`, or asset with `.svg` / `?url`).
- [ ] Relative imports use explicit extensions where applicable.
- [ ] Constants/TS modules that reference assets use inline `(await import('$/assets/...')).default`.
- [ ] Components that reference assets use top-level `import x from '$/assets/...'`.
- [ ] No path builder helpers or remote asset URLs for bundled icons/assets.

## Status

Spec created from `.cursor/rules/import-extensions.mdc`. Cursor rule references this spec.
