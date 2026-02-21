# Spec 040: CSS Primitives Usage

Ensure UI styling relies on shared primitives from
`src/styles/components.css` before adding component-specific overrides in
`<style>` tags.

## Scope

- Apply existing primitives and semantic styles from
  `src/styles/components.css` wherever possible.
- Local overrides live in component `<style>` tags using classes.
- **Use CSS classes for all local `<style>` selectors.** For state/variant styling, add classes (e.g. `class:variant-name={condition}`) and target them with `.base-class.variant-name`, not `&[data-*]`.
- **Exception:** When overriding CSS variables, use nested `&[data-*]` rules on the class.

## Non-goals

- Do not add new rules to `src/styles/components.css`.
- Do not change global typography or design tokens unless required by a spec.

## Acceptance criteria

### Styling usage

- [x] New or updated component styles use primitives from
  `src/styles/components.css` before bespoke overrides.
- [x] Component-specific overrides are defined on local classes (not bare
  element selectors) unless a primitive already covers the element.
- [x] Local `<style>` blocks may target element selectors when nested under a
  semantic parent class and no differentiation is needed.
- [x] Component `<style>` selectors target classes; state/variants use classes
  (e.g. `.base.variant-name`). Data-attribute selectors are only used as nested
  `&[data-*]` for CSS variable overrides.
- [x] Remove local `data-*` attributes once styles switch to classes (keep only
  data attributes that provide primitive layout or variant state).
- [x] When a Svelte element has multiple attributes, each attribute is placed on
  its own line.
- [x] Variant styling uses classes; `&[data-*]` is reserved for CSS variable
  overrides within a class definition.
- [x] No changes are made to `src/styles/components.css`.

### Review checklist

- [x] Any `<style>` tag changes reference a primitive class or base selector
  first, then override via class rules.
- [x] No new one-off global selectors are introduced.

## Status

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 040—class-based variants): Replaced &[data-*] variant styling with class-based styling across components: Icon.svelte (shape-square/shape-circle), ToastContainer.svelte (position-*), about/+page.svelte and +page.svelte (shape-*), Panel.svelte (focused), TruncatedValue.svelte (format-visual/format-visual-characters), AgentChatTurnNode.svelte (status-*), PanelTree.svelte (direction-horizontal/vertical), BridgeFlow.svelte (selected, tag-*, warning), Toast.svelte (type-*, paused), LiveTransfers routes/views (active), CctpExecution.svelte (done). &[data-*] retained only for CSS variable overrides (+layout.svelte, Navigation.svelte). All 10 AC confirmed. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 040 again): Fixed 2 more violations—CoinName.svelte and CoinAmount.svelte bare `abbr` selectors replaced with class `.coin` (text-decoration, cursor on .coin). All 10 AC confirmed.

## Output when complete

`DONE`
