# Spec 129: EntityView footer — sources and links

Add a footer to `EntityView` that shows (1) a list of **data sources** (DataSource enum, displayed via existing label mapping) used to show the entity data, and (2) a list of **direct links** to sources (e.g. official EIP website, official CAIP page).

## References

- Spec 042 (entity data sources), Spec 088 (EntityView)

## Scope

- **DataSource labels:** Use the constants file pattern (spec 045): canonical array `dataSources` with `{ id, label }`, derived `dataSourceLabelById` in `src/constants/data-sources.ts`.
- **List formatting:** Use `Intl.ListFormat` (e.g. in a small helper in `src/lib/`) to format the list of source labels (e.g. "Eips, Caips" or "Eips and Caips").
- **EntityView props:**
  - `sources?: DataSource[]` — data sources used to display the entity (optional; when provided, footer shows "Data from: X, Y, Z").
  - `sourceLinks?: { label: string; href: string }[]` — direct links to official or canonical sources (e.g. "Official EIP" → `https://eips.ethereum.org/EIPS/eip-{number}`).
- **Footer:** Rendered only when `layout !== ContentOnly` and at least one of `sources` or `sourceLinks` is non-empty. Two lines/sections: (1) "Data from: &lt;formatted source list&gt;", (2) "Links: &lt;list of links&gt;" (or equivalent copy). Use semantic HTML and existing styling patterns.

## Acceptance criteria

- [x] DataSource enum has a label mapping used for display (canonical `dataSources` array and derived `dataSourceLabelById` per spec 045).
- [x] A helper `formatSourceList(sources)` in `src/lib/formatSourceList.ts` uses `Intl.ListFormat` and the mapping to return a formatted string.
- [x] EntityView accepts optional `sources` and `sourceLinks` and renders a footer when either is non-empty (and layout is not ContentOnly).
- [x] Proposal detail page passes `sources` and `sourceLinks` (official EIP URL) into EntityView.
- [x] CAIP detail page passes `sources` and `sourceLinks` (official CAIP URL) into EntityView.

## Status

Complete.
