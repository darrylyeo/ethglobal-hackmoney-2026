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

- Related: collapsible list sections use `ItemsListCollapsible` (Collapsible + ItemsList); see Spec 088.

## Non-goals

- Virtualized rendering (e.g. windowing).
- Dynamic data fetching or pagination logic.
- Custom animation/transition behaviors.

## Acceptance criteria

- [x] `ItemsList` accepts the generic `_Item` and the full prop surface described
  in the scope.
- [x] `getKey` is used to derive stable keys for items and placeholders.
- [x] `getSortValue` is used to sort items before render.
- [x] `getGroupKey` + `getGroupLabel` enable grouped rendering using
  `Map.groupBy` semantics when provided, otherwise render as a single list.
- [x] `placeholderKeys` accepts both explicit keys and numeric key ranges
  (`[number, number]`), with visible placeholders derived by `visiblePlaceholderKeys`.
- [x] `Item` snippet receives `{ key }` and the discriminated union of
  `{ item?: never, isPlaceholder: false } | { item: _Item, isPlaceholder: true }`.
- [x] `scrollPosition` determines which CSS property is used to preserve scroll
  position across layout shifts, with behavior documented in the component.

## Status

Complete. Re-verification 2026-02-07 (PROMPT_build one spec, re-verify mode): all 7 AC confirmed—ItemsList.svelte generics _Item/_Key/_GroupKey, props (items, getKey, getSortValue, getGroupKey, getGroupLabel, placeholderKeys, visiblePlaceholderKeys, scrollPosition, Item), getKey for stable keys, getSortValue for sort, Map.groupBy when getGroupKey+getGroupLabel, placeholderKeys Set with range expansion and visiblePlaceholderKeys, Item snippet discriminated union, scrollPosition→overflow-anchor (comment + data-scroll-position). Usages: Network, Block, Transaction, coin/[symbol]. test:unit 44 Deno + 159 Vitest passed. Previous: ItemsList.svelte in src/components/ with generics _Item and Key; getKey, getSortValue, getGroupKey, getGroupLabel, placeholderKeys (Set with range expansion), visiblePlaceholderKeys (bindable), scrollPosition, Item snippet. Sorted and optionally grouped via Map.groupBy; placeholders filtered by expanded keys. scrollPosition mapped to overflow-anchor (Start=first child, End=last child, Auto=default). Re-verification 2026-02-05 (PROMPT_build execute one spec): all 7 AC verified; test:unit 44 Deno + 101 Vitest passed. Re-verification 2026-02-05 (PROMPT_build execute one spec, no incomplete specs): re-verified 062; all 7 AC confirmed in ItemsList.svelte and usages (Network, Block, Transaction, coin/[symbol]); test:unit 44 Deno + 101 Vitest passed.

## Output when complete

`DONE`
