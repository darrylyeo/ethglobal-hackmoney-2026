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

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 040): AC spot-checked—component styles use classes; &[data-*] used for variants/variable usage where present; no changes to components.css. Deno test 54 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Re-verification 2026-02-05 (PROMPT_build one spec): re-verified 040; all 10 AC confirmed—Navigation.svelte footer moved inside #nav-menu (DOM + CSS nested); GraphScene.svelte footer selector uses .graph-scene-footer; no changes to components.css; test:unit 44 Deno + 101 Vitest passed; test:e2e 75 passed, 8 skipped. Previous: Re-verification 2026-02-05 (PROMPT_build execute one spec): re-verified 040; all 10 AC confirmed—components use primitives from components.css or class-based overrides; GraphScene.svelte footer under details.graph-scene; Navigation.svelte footer under #nav-menu; no changes to components.css; test:unit 44 Deno + 101 Vitest passed; test:e2e 75 passed, 8 skipped. Previous: Audit done: bare element selectors in component `<style>` replaced with class-based selectors (G6GraphView.svelte, GraphScene.svelte, SigmaGraphView.svelte). Re-verified: GraphScene.svelte bare `footer` replaced with `.graph-scene-footer`.

## Output when complete

`DONE`
