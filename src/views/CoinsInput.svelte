<script lang="ts">
	// Types/constants
	import { coinSymbolGroups } from '$/constants/filter-groups.ts'


	// Props
	let {
		value = $bindable([] as string[]),
		items: itemsProp = undefined as
			| readonly string[]
			| readonly { id?: string; label: string; items: readonly string[] }[]
			| undefined,
		placeholder = 'Coin',
		disabled,
		ariaLabel = 'Filter by coin',
		...rootProps
	}: {
		value?: string[]
		items?:
			| readonly string[]
			| readonly { id?: string; label: string; items: readonly string[] }[]
		placeholder?: string
		disabled?: boolean
		ariaLabel?: string
		[key: string]: unknown
	} = $props()


	// (Derived)
	const useDefaultGroups = $derived(itemsProp == null || itemsProp.length === 0)
	const first = $derived(itemsProp?.[0])
	const isGrouped = $derived(
		!useDefaultGroups &&
			typeof first === 'object' &&
			first !== null &&
			'label' in first &&
			'items' in first,
	)
	const defaultGrouped = $derived(
		coinSymbolGroups.map((g) => ({
			id: g.id,
			label: g.label,
			items: [...g.symbols],
		})),
	)
	const groupedItems = $derived(
		useDefaultGroups
			? defaultGrouped
			: isGrouped
				? (
						itemsProp as readonly {
							id?: string
							label: string
							items: readonly string[]
						}[]
					).map((g) => ({
						id: g.id ?? g.label,
						label: g.label,
						items: [...g.items],
					}))
				: [],
	)
	const flatItems = $derived(
		!useDefaultGroups && !isGrouped
			? [...(itemsProp as readonly string[])]
			: [],
	)
	const comboboxItems = $derived(
		groupedItems.length > 0 ? groupedItems : flatItems,
	)


	// Components
	import Combobox from '$/components/Combobox.svelte'
</script>

<Combobox
	{...rootProps}
	type="multiple"
	items={comboboxItems}
	bind:value
	{placeholder}
	{disabled}
	{ariaLabel}
	getItemId={(s: string) => s}
	getItemLabel={(s: string) => s}
/>