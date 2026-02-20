# Spec 111: $derived() and $derived.by() usage and formatting

Use `$derived(expression)` for single-expression derived state; use `$derived.by(() => { ... })` when the computation needs multiple statements or a block. Format with values indented.

## Scope

- Correct choice between `$derived(...)` and `$derived.by(() => { ... })`.
- Consistent formatting: multi-line derived values are indented on the line(s) after the opening `(` or `() => {`.

## Rules

1. **$derived(expression)** — Use when the value is a single expression (including ternaries, function calls, object/array literals). Do not wrap an IIFE in `$derived`; use `$derived.by` instead.
2. **$derived.by(() => { ... })** — Use when the computation requires multiple statements (e.g. `const x = ...; return ...`), loops, or any block body. The callback must return the derived value.
3. **Indent values** — When the expression or callback body spans multiple lines, indent the continuation:
   - `$derived(` → value on next line(s) indented (one tab from the `const` line).
   - `$derived.by(() => {` → body statements indented (one tab for the block).

## Examples

```svelte
const name = $derived(page.params.name ?? '')
const count = $derived(
	items.length > 0 ? items.length : 0,
)
const total = $derived.by(() => {
	const range = [...ids].find((k): k is [number, number] => Array.isArray(k))
	return range != null ? range[1] + 1 : 0
})
```

## Status

Active. 2026-02-19: Network.svelte `blocksTotal` converted from `$derived((() => { ... })())` to `$derived.by(() => { ... })`.
