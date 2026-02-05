<script lang="ts" generics="Item extends { address: `0x${string}` }">
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { Network$Id } from '$/data/Network'
	import { normalizeAddress } from '$/lib/address'


	// Props
	let {
		items,
		value = $bindable(null as `0x${string}` | null),
		placeholder = 'Select address',
		disabled,
		name,
		id,
		ariaLabel = 'Address',
		network = 1 as Network$Id,
		getItemId = (item: Item) => item.address,
		getItemLabel = (item: Item) => item.address,
		Item: ItemSnippet,
		...rootProps
	}: {
		items: readonly Item[]
		value?: `0x${string}` | null
		placeholder?: string
		disabled?: boolean
		name?: string
		id?: string
		ariaLabel?: string
		network?: Network$Id
		getItemId?: (item: Item) => string
		getItemLabel?: (item: Item) => string
		Item?: Snippet<[item: Item, selected: boolean]>
		[key: string]: unknown
	} = $props()


	// State
	let raw = $state('')


	// (Derived)
	$effect(() => {
		raw = value ?? ''
	})
	$effect(() => {
		const next = raw === '' ? null : normalizeAddress(raw)
		if (next !== null || raw === '') value = next
	})


	// Components
	import Address from '$/components/Address.svelte'
	import Select from '$/components/Select.svelte'
</script>

{#snippet defaultItem(shared: Item, selected: boolean)}
	<span data-row="start gap-0" data-selected={selected}>
		<Address {network} address={shared.address} />
	</span>
{/snippet}

<Select
	{...rootProps}
	{items}
	bind:value={raw}
	{getItemId}
	{getItemLabel}
	{placeholder}
	{disabled}
	{name}
	{id}
	{ariaLabel}
	Item={ItemSnippet ?? defaultItem}
/>




