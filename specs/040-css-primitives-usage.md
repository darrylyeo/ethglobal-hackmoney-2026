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

- [ ] New or updated component styles use primitives from
  `src/styles/components.css` before bespoke overrides.
- [ ] Component-specific overrides are defined on local classes (not bare
  element selectors) unless a primitive already covers the element.
- [ ] Any data-attribute variants are implemented with nested `&[data-*]` rules
  in the class definition.
- [ ] No changes are made to `src/styles/components.css`.

### Review checklist

- [ ] Any `<style>` tag changes reference a primitive class or base selector
  first, then override via class rules.
- [ ] No new one-off global selectors are introduced.

## Status

Not started.

## Output when complete

`DONE`
