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
- [x] A formatting pass inlines every single-use variable and type (const/let/type alias used only once) at the single use site; avoid inlining when it would harm readability.
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

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 041): All 9 AC confirmed—TS: single quotes, no statement semicolons, implicit return types; types avoid assertions, single-use inlined; multi-line repo style; Svelte section order and two blank lines; comment groups two blank lines; import grouping, no Svelte 4; one prop per line; component styles classes and &[data-*]. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: 2026-02-05 (PROMPT_build): Formatting is manual to repo preferences. `deno task format` runs only `scripts/_svelte-section-spacing.ts`, which enforces exactly two empty lines between top-level sections (script/head/markup/style) and between comment-delimited groups inside `<script>`. TS/Svelte style (quotes, semicolons, trailing commas, useTabs, multi-line, etc.) is applied by hand or by the formatter subagent. Formatter subagent (`.cursor/agents/formatter.md`) includes an explicit pass to inline single-use variables and types.

## Output when complete

`DONE`
