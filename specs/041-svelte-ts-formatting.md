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

- [ ] TypeScript files use `'` for strings, no statement `;`, and
  prefer implicit return types.
- [ ] Types avoid assertions and inline single-use variables/types.
- [ ] Multi-line expressions follow the repo style for line breaks,
  indentation, and trailing commas.

### Svelte formatting

- [ ] Svelte component sections are ordered as: module script, instance script,
  head, markup, style (with two empty lines between sections).
- [ ] Svelte scripts use the required import grouping and ordering, and avoid
  Svelte 4 constructs (`onMount`, `$:`, `writable()`).
- [ ] Component-local styles follow the CSS rules (classes for overrides,
  data-attribute variants via nested `&[data-*]` rules).

## Status

Not started.

## Output when complete

`DONE`
