# Spec 128: SearchableText component

Add a reusable `SearchableText.svelte` component that renders text with fuzzy-matched substrings wrapped in `<mark>`, and optionally syncs match spans to a parent-supplied `SvelteSet` via `$bindable()` for use in filtering (e.g. ItemsList).

## Scope

- **Shared lib:** `src/lib/fuzzyMatch.ts` — export type `Match = { start: number; end: number }` and `fuzzyMatch(text: string, query: string): Match[]` (subsequence match, case-insensitive, non-overlapping spans).
- **Component:** `src/components/SearchableText.svelte`
- **Props:**
  - `text: string` — text to render
  - `query: string` — fuzzy-search string (empty = no highlighting)
  - `matches = $bindable<SvelteSet<Match>>()` — optional; when provided, component adds/removes matches in an `$effect` so parent can read match set
- **Behavior:**
  - Use `fuzzyMatch(text, query)` for spans. Escape HTML for entire text, wrap matched ranges in `<mark>`, output via `{@html ...}` (spec 028: no user-controlled HTML in matches).
  - In `$effect`: when `query` or `text` change, compute matches, clear `matches` if bound, then add each `Match` to `matches`.

## Non-goals

- Full-text or regex search; fuzzy is subsequence-only.
- Styling of `<mark>` (browser default or global CSS).

## Acceptance criteria

- [ ] `src/lib/fuzzyMatch.ts` exists with `Match` and `fuzzyMatch`.
- [ ] `SearchableText.svelte` exists with props `text`, `query`, optional `matches` (bindable); renders escaped text with `<mark>` for fuzzy spans; `$effect` syncs to `matches` when provided.
- [ ] NavigationItem uses SearchableText for nav item titles (replacing inline `highlightText`/`escapeHtml`).
- [ ] ItemsList optionally supports search (getSearchText, matchesForItem, search input, filter by matches, Item snippet receives searchQuery + matches when search enabled).

## Status

In progress.
