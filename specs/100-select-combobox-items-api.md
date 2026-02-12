# Spec 100: Select and Combobox items API

Split into four components: `Select`, `SelectMultiple`, `Combobox`, `ComboboxMultiple`. All use flat `items` with `getItemId` / `getItemLabel` / `getItemDisabled`, and optional grouping via `getItemGroupId` / `getGroupLabel` derived with `Map.groupBy`.

## Scope

- **Components:**
  - `src/components/Select.svelte` — single selection
  - `src/components/SelectMultiple.svelte` — multiple selection
  - `src/components/Combobox.svelte` — single selection with search
  - `src/components/ComboboxMultiple.svelte` — multiple selection with chips
- **Generic:** `_Item` — any type
- **Items API (required):**
  - `items: readonly _Item[]` — flat array only
  - `getItemId: (item: _Item) => string` — stable id (default: `String(item)`)
  - `getItemLabel: (item: _Item) => string` — display label (default: `String(item)`)
  - `getItemDisabled?: (item: _Item) => boolean` — optional disabled flag
- **Grouping (optional):**
  - `getItemGroupId?: (item: _Item) => string` — when provided, groups via `Map.groupBy`-style reduction
  - `getGroupLabel?: (groupId: string) => string` — group heading (default: `groupId`)
- **Value types:**
  - Select / Combobox: `value` is `_Item | null`
  - SelectMultiple / ComboboxMultiple: `value` is `_Item[]`

## Behavior

- When `getItemGroupId` is set: groups derived from `items.reduce` into `Map<string, _Item[]>`, rendered as `Select.Group` / `Combobox.Group` with `GroupHeading`
- No backward compatibility with `{ id, label, items }[]` items shape

## Acceptance criteria

- [x] Four separate components: Select, SelectMultiple, Combobox, ComboboxMultiple
- [x] All accept only `items: readonly _Item[]` with getItemId / getItemLabel / getItemDisabled
- [x] getItemGroupId and getGroupLabel for Map.groupBy-derived grouping
- [x] _Item can be any type
- [x] All usages updated to the appropriate component

## Status

Complete.
