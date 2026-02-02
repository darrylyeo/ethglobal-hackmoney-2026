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
- [x] Any data-attribute variants are implemented with nested `&[data-*]` rules
  in the class definition.
- [x] No changes are made to `src/styles/components.css`.

### Review checklist

- [x] Any `<style>` tag changes reference a primitive class or base selector
  first, then override via class rules.
- [x] No new one-off global selectors are introduced.

## Status

Complete. Audit done: bare element selectors in component `<style>` replaced with class-based selectors (G6GraphView.svelte, GraphScene.svelte, SigmaGraphView.svelte).

## Output when complete

`DONE`
