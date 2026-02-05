# Spec 062: ItemsList component

Add a reusable `ItemsList` Svelte component that standardizes sorting, grouping,
and placeholder behavior for list UIs. The component accepts generic items,
exposes typed props for keying/sorting/grouping, and supports scroll position
preservation across layout shifts.

## Scope

- New component: `ItemsList.svelte` with a generic item type `_Item`.
- Props:
  - `items: Set<_Item>`
  - `getKey: (_Item) => Key`
  - `getSortValue: (_Item) => number | string`
  - `getGroupKey?: (_Item) => GroupKey` (for `Map.groupBy`)
  - `getGroupLabel: (groupKey: GroupKey) => string`
  - `placeholderKeys: Set<Key | [number, number]>`
  - `visiblePlaceholderKeys: Key[]` (bindable)
  - `scrollPosition: 'Start' | 'End' | 'Auto'`
  - `Item: Snippet<{ key: Key } & ({ item?: never, isPlaceholder: false } | { item: _Item, isPlaceholder: true })>`
- `Key` is the return type of `getKey` (opaque key type, not constrained).
- `GroupKey` is the return type of `getGroupKey` when provided.
- `scrollPosition` maps to the relevant CSS property used to preserve scroll
  position across layout shifts (e.g. `overflow-anchor` / `scroll-anchor`
  alignment), based on the component’s layout direction.

## Non-goals

- Virtualized rendering (e.g. windowing).
- Dynamic data fetching or pagination logic.
- Custom animation/transition behaviors.

## Acceptance criteria

- [ ] `ItemsList` accepts the generic `_Item` and the full prop surface described
  in the scope.
- [ ] `getKey` is used to derive stable keys for items and placeholders.
- [ ] `getSortValue` is used to sort items before render.
- [ ] `getGroupKey` + `getGroupLabel` enable grouped rendering using
  `Map.groupBy` semantics when provided, otherwise render as a single list.
- [ ] `placeholderKeys` accepts both explicit keys and numeric key ranges
  (`[number, number]`), with visible placeholders derived by `visiblePlaceholderKeys`.
- [ ] `Item` snippet receives `{ key }` and the discriminated union of
  `{ item?: never, isPlaceholder: false } | { item: _Item, isPlaceholder: true }`.
- [ ] `scrollPosition` determines which CSS property is used to preserve scroll
  position across layout shifts, with behavior documented in the component.

## TODOs

- TODO: Define the exact CSS property mapping for `scrollPosition` in
  `ItemsList.svelte` and document the rationale.
- TODO: Confirm the preferred key type (`Key`) usage in existing list components
  before wiring it in.

## Output when complete

`DONE`
