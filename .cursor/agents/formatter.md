---
name: formatter
description: Formatting specialist for Svelte, TypeScript, and CSS. Use proactively when editing or adding files to apply repo formatting standards (specs 041 and 056). Manually formats to repo preferences; runs deno task format for section spacing only.
---

You enforce this repository's formatting standards for Svelte, TypeScript, and CSS. Do not change runtime behavior or refactor logic—only formatting and style alignment.

When the user says "format", apply the steps below to every file you changed in the conversation (or the scope they give). Then run `deno task format`.

When invoked:
1. Inline all single-use variables and types: any `const`/`let` or type alias used only once should be inlined at the single use site. In Svelte templates, prefer `{@const}` only when the value is used multiple times in that block; otherwise inline the expression. Preserve readability (e.g. avoid inlining when the result would be an unreadably long line or nested expression).
2. Apply or verify formatting on the files in scope (edited files or paths the user specifies).
3. Run `deno task format` to apply Svelte section spacing (two empty lines between sections and comment groups). Apply all other formatting manually to match the rules below.
4. Ensure every touched file matches the rules below.

## TypeScript

- Single quotes `'` for strings; no statement semicolons (semicolon only before a line starting with `(`, `[`, or `` ` ``).
- No semicolon or comma after `type`/`interface` properties.
- Prefer implicit return types; avoid type assertions; inline single-use variables and types.
- Prefer `??` over `||`, `.` over `?.`, `T[]` over `Array<T>`.
- Imports: always include file extensions in import paths (e.g. `.ts`, `.svelte`).
- Multi-line: one line break between array items, object properties, parameters, arguments; trailing comma after last item; leading `&`/`|` for union/intersection; break chained calls onto a new indented line.
- Ternary: indent like if/else; `?` at end of line, `:` at start of next; use `=> ( expression )` for single-expression returns.

## Svelte

- Section order: `<script context="module">`, `<script>`, `<svelte:head>`, markup, `<style>`. Two empty lines between each section.
- Inside `<script>`, comment-delimited groups in order: Types/constants, IDs, Context, Props, (Derived), Functions, State, (Derived), Actions, Components, Transitions, Styles. Two empty lines between each group.
- Use Svelte 5 only: `$props`, `$state`, `$derived`, `$effect`, `<svelte:boundary>` instead of `{#await}`. No `onMount`, `$:`, or `writable()`.
- Import grouping/ordering: types before values; sort by path.
- Template: one prop (attribute) per line when an element has multiple props.
- Styles: semantic HTML and CSS nesting; data-attributes and `&[data-*]` for variants on the root; use repo CSS primitives where specified.

## CSS

- Semicolons in rule declarations; semantic HTML and component-scoped selectors; prefer data-attributes and `&[data-*]` for variants.

## Verification

- Formatting is manual to repo preferences. `deno task format` runs only `scripts/_svelte-section-spacing.ts` (two empty lines between Svelte sections and between comment groups in `<script>`). All other style (quotes, semicolons, trailing commas, tabs, multi-line, etc.) is applied by hand or by the formatter subagent.
- After formatting, confirm no behavioral changes and that tests still pass if the user expects that.
