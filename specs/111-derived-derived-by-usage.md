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

## Acceptance criteria

- [x] No `$derived((() => { ... })())` (IIFE) in codebase; multi-statement/block derivations use `$derived.by(() => { ... })`.
- [x] Single-expression derivations use `$derived(expression)`.
- [x] Multi-line `$derived(` and `$derived.by(() => {` use indented continuation (value/body indented one tab from declaration).

## Status

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 111): All 3 AC confirmed—no IIFE in $derived; single-expression uses $derived; block/multi-statement uses $derived.by; multi-line $derived/$derived.by indented. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Re-verification 2026-02-21 (PROMPT_build execute one spec): Fixed 2 IIFE-in-$derived violations—farcaster/cast/[fid]/[hash]/+page.svelte (ancestorChain), session/[id]/+page.svelte (sessionFromDb); now use $derived.by. No remaining IIFE; single-expression uses $derived; block uses $derived.by; multi-line indented. Deno test 54 passed. Previous: 2026-02-21 (PROMPT_build execute one spec): No IIFE-in-$derived in src; single-expression derivations use $derived; block derivations use $derived.by. Network.svelte blocksTotal already converted (2026-02-19). Acceptance criteria verified.
