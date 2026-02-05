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
- [x] Within `<script>`, comment-delimited groups (Types/constants, IDs,
  Context, Props, etc.) have two empty lines between each group.
- [x] Svelte scripts use the required import grouping and ordering, and avoid
  Svelte 4 constructs (`onMount`, `$:`, `writable()`).
- [x] In the template, one prop (attribute) per line when an element has
  multiple props.
- [x] Component-local styles follow the CSS rules (classes for overrides,
  data-attribute variants via nested `&[data-*]` rules).

## Status

Complete. 2026-02-05 (PROMPT_build): Prettier (.prettierrc: singleQuote, semi: false, trailingComma, useTabs) enforces TS/Svelte formatting; `scripts/_svelte-section-spacing.mjs` enforces two empty lines between top-level sections (script/head/markup/style) and between comment-delimited groups inside `<script>`. Format + section script run across src; unit tests (41 Deno + 101 Vitest) pass.

## Output when complete

`DONE`
