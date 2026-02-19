# Spec 105: Sorts component

Add a reusable generic `Sorts.svelte` component that renders sort options and emits sorted items. The design parallels the Filters component (099) with similar binding data flow, modularity, and callback props.

## Scope

- **Component:** `src/components/Sorts.svelte`
- **Module exports:**
  - `Sort<_Item, _SortId extends string = string>` type: `{ id, label, compare }` where `compare` is an `Array.sort` comparator `(a: _Item, b: _Item) => number`
- **Props:**
  - `items: _Item[]`
  - `sortOptions: Sort<_Item, _SortId>[]`
  - `activeSortId?: _SortId | ''` (bindable)
  - `sortedItems?: _Item[]` (bindable)
  - `defaultSortId?: _SortId`
  - `setSortById?: (sortId: _SortId | '') => void` (bindable)
  - plus passthrough div attributes
- **Rendering:**
  - Only renders when `sortOptions.length > 1`
  - Single `Select` dropdown to choose sort order
  - Uses existing `Select.svelte` with getter/setter bind for `value`
- **Sorting behavior:**
  - When `activeSortId === ''`, uses `defaultSortId ?? sortOptions[0]?.id` as effective sort
  - Applies selected sort's `compare` to `items` and assigns result to `sortedItems` via `$effect`
  - No sort UI when 0 or 1 options; `sortedItems` remains pass-through

## Styling

- Use the same fieldset/legend pattern and `data-card` as Filters.
- Legend: "Sort" with same uppercase/letter-spacing as filter groups.

## Integration

- **FarcasterFilteredEntityList:** Accepts optional `sortOptions` and `defaultSortId`. Renders Sorts next to Filters when `sortOptions.length > 1`. When present, display order uses Sorts output; otherwise falls back to `sortBy` prop.
- **Farcaster pages (casts, channels, users):** Provide sortOptions appropriate to entity type (timestamp, name, followers, username).
- **CoinBalances:** Sorts next to Filters in summary; options include symbol A–Z/Z–A and value high/low (value compare closes over prices).

## Non-goals

- Multi-level sort (primary + secondary keys).
- URL param syncing.
- Sort direction toggle separate from options.

## Acceptance criteria

- [x] `src/components/Sorts.svelte` exists with the exports and props above.
- [x] Renders Select only when `sortOptions.length > 1`.
- [x] `activeSortId` and `sortedItems` bind correctly; `defaultSortId` applied when `activeSortId === ''`.
- [x] FarcasterFilteredEntityList integrates Sorts next to Filters.
- [x] Casts, channels, users pages use sortOptions.
- [x] CoinBalances uses Sorts for balance grid ordering.

## Status

Complete.
