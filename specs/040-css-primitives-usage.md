# Spec 040: CSS Primitives Usage

Ensure UI styling relies on shared primitives from
`src/styles/components.css` before adding component-specific overrides in
`<style>` tags.

## Scope

- Apply existing primitives and semantic styles from
  `src/styles/components.css` wherever possible.
- Local overrides live in component `<style>` tags using classes.
- Data-attribute variants set CSS variables via nested `&[data-*]` rules on the
  class.

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
- [x] Component `<style>` selectors target classes; data-attribute selectors are
  only used as nested `&[data-*]` variants on those classes for variable
  overrides.
- [x] Remove local `data-*` attributes once styles switch to classes (keep only
  data attributes that provide primitive layout or variant state).
- [x] When a Svelte element has multiple attributes, each attribute is placed on
  its own line.
- [x] Any data-attribute variants are implemented with nested `&[data-*]` rules
  in the class definition.
- [x] No changes are made to `src/styles/components.css`.

### Review checklist

- [x] Any `<style>` tag changes reference a primitive class or base selector
  first, then override via class rules.
- [x] No new one-off global selectors are introduced.

## Status

Complete. Re-verification 2026-02-05 (PROMPT_build execute one spec): re-verified 040; all 10 AC confirmed—components use primitives from components.css or class-based overrides; GraphScene.svelte footer under details.graph-scene; Navigation.svelte footer under #nav-menu; no changes to components.css; test:unit 44 Deno + 101 Vitest passed; test:e2e 75 passed, 8 skipped. Previous: Audit done: bare element selectors in component `<style>` replaced with class-based selectors (G6GraphView.svelte, GraphScene.svelte, SigmaGraphView.svelte). Re-verified: GraphScene.svelte bare `footer` replaced with `.graph-scene-footer`.

## Output when complete

`DONE`
