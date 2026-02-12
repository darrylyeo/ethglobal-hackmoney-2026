# Spec 099: Filters component

Add a reusable generic `Filters.svelte` component that renders grouped filters and emits filtered items. The component supports four display modes (`Select`, `Combobox`, `Options`, `Snippet`) and two per-group operations (`Union`, `Intersection`).

## Scope

- **Component:** `src/components/Filters.svelte`
- **Module exports:**
  - `FilterDisplayType` enum:
    - `Select = 'Select'`
    - `Combobox = 'Combobox'`
    - `Options = 'Options'`
    - `Snippet = 'Snippet'`
  - `FilterOperation` enum:
    - `Union = 'union'`
    - `Intersection = 'intersection'`
  - `Filter<_Item, _FilterId extends string = string>` type
  - `FilterGroup<_Item, _FilterId extends string = string>` type
- **Props:**
  - `items: _Item[]`
  - `filterGroups: FilterGroup<_Item, _FilterId>[]`
  - `activeFilters?: Set<Filter<_Item, _FilterId>>` (bindable)
  - `filteredItems: _Item[]` (bindable)
  - `toggleFilter?: (filter: Filter<_Item, _FilterId>, forceExclusive?: boolean) => void` (bindable)
  - `toggleFilterById?: (filterId: _FilterId, forceExclusive?: boolean) => void` (bindable)
  - `Group?: Snippet<...>` for custom per-group UI in `Snippet` mode
  - plus passthrough form attributes
- **Rendering:**
  - `exclusive: true` groups render single-selection UI
  - `exclusive: false` groups render multi-selection UI
  - display mode mapping:
    - `Select` => use existing `Select.svelte`
    - `Combobox` => use existing `Combobox.svelte`
    - `Options` => radio/checkbox option list
    - `Snippet` => render `Group` snippet for full custom group controls
- **Filtering behavior:**
  - Active filters are grouped by filter group
  - For each group:
    - `Union`: item passes if it matches any active filter in that group
    - `Intersection`: item passes if it matches all active filters in that group
  - Item must pass all groups to remain in `filteredItems`

## Styling

- Include built-in styles for filter labels/count chips and disabled state.
- Use the same vanilla CSS clear-button visibility selector pattern:
  - hide reset button when current form selection state matches default attributes (`checked`/`selected`)
  - show reset button when any checkbox/radio/select diverges from defaults

## Non-goals

- Server/data fetching integration.
- URL param syncing.
- Virtualized filter lists.

## Acceptance criteria

- [x] `src/components/Filters.svelte` exists with the exports and props above.
- [x] `Select` and `Combobox` display modes are implemented with existing local components.
- [x] `Options` display mode supports exclusive and non-exclusive groups.
- [x] `Snippet` display mode supports custom per-group rendering via snippet.
- [x] Group operation logic supports `Union` and `Intersection`.
- [x] Reset button uses the vanilla CSS selector pattern to auto-hide in default state.

## Status

Complete.
