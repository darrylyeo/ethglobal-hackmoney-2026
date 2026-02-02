# Spec 041: Svelte TS Formatting

Ensure Svelte and TypeScript are formatted to match the repository preferences.

## Scope

- Normalize formatting across Svelte components and TypeScript modules to match
  the documented project style.
- Apply the same formatting rules consistently across new and existing code.

## Non-goals

- Do not change runtime behavior beyond formatting or style alignment.
- Do not rework logic, APIs, or add new features as part of this spec.

## Acceptance criteria

### TypeScript formatting

- [x] TypeScript files use `'` for strings, no statement `;`, and
  prefer implicit return types.
- [x] Types avoid assertions and inline single-use variables/types.
- [x] Multi-line expressions follow the repo style for line breaks,
  indentation, and trailing commas.

### Svelte formatting

- [x] Svelte component sections are ordered as: module script, instance script,
  head, markup, style (with two empty lines between sections).
- [x] Svelte scripts use the required import grouping and ordering, and avoid
  Svelte 4 constructs (`onMount`, `$:`, `writable()`).
- [x] Component-local styles follow the CSS rules (classes for overrides,
  data-attribute variants via nested `&[data-*]` rules).

## Status

Complete. Prettier config (`.prettierrc`): singleQuote, semi: false, trailingComma: all, useTabs; prettier-plugin-svelte. `pnpm run format` formats src, e2e, scripts. Script `scripts/_svelte-section-spacing.mjs` enforces two empty lines between Svelte sections (script, head, markup, style). Fixed unescaped quote in `src/lib/yellow/index.ts`. Style guide (user rules) documents implicit return types, no assertions, inline single-use; Svelte section order and import grouping already followed in codebase.

## Output when complete

`DONE`
