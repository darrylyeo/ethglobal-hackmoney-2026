<script lang="ts">
	// Types/constants
	import { type CoinId } from '$/constants/coins.ts'
	import {
		type CoinIdGroupId,
		coinIdGroups,
		coinIdGroupsById,
	} from '$/constants/filter-groups.ts'


	// Props
	let {
		value = $bindable([] as string[]),
		items: itemsProp = undefined as readonly string[] | undefined,
		placeholder = 'Coin',
		disabled,
		ariaLabel = 'Filter by coin',
		...rootProps
	}: {
		value?: string[]
		items?: readonly string[]
		placeholder?: string
		disabled?: boolean
		ariaLabel?: string
		[key: string]: unknown
	} = $props()

	// (Derived)
	const useDefaultGroups = $derived(
		itemsProp == null || itemsProp.length === 0
	)
	const items = $derived(
		useDefaultGroups
			? coinIdGroups.flatMap((g) => [...g.coinIds])
			: [...(itemsProp ?? [])],
	)
	const getItemGroupId = $derived.by(() =>
		useDefaultGroups
			? (s: string) =>
					coinIdGroups.find((g) => g.coinIds.includes(s as CoinId))?.id ?? ''
			: undefined,
	)
	const getGroupLabel = $derived.by(() =>
		useDefaultGroups
			? (id: string) =>
					coinIdGroupsById[id as CoinIdGroupId]?.label ?? id
			: undefined,
	)


	// Components
	import ComboboxMultiple from '$/components/ComboboxMultiple.svelte'
</script>


<ComboboxMultiple
	{...rootProps}
	{items}
	bind:value
	getItemId={(s: string) => s}
	getItemLabel={(s: string) => s}
	{...(getItemGroupId && { getItemGroupId, getGroupLabel })}
	{placeholder}
	{disabled}
	{ariaLabel}
/>
