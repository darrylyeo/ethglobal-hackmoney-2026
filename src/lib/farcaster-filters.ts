import {
	FilterDisplayType,
	FilterOperation,
	type Filter,
	type FilterGroup,
} from '$/components/Filters.svelte'

export const farcasterComboboxFilterGroup = <T, FId extends string>(
	id: string,
	label: string,
	filters: Filter<T, FId>[],
): FilterGroup<T, FId> => ({
	id,
	label,
	displayType: FilterDisplayType.Combobox,
	operation: FilterOperation.Union,
	exclusive: false as const,
	filters,
})
