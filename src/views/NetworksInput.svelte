<script lang="ts">
	// Types/constants
	import type { Network } from '$/constants/networks.ts'
	import { networkFilterGroups } from '$/constants/filter-groups.ts'


	// Props
	let {
		value = $bindable([] as string[]),
		placeholder = 'Network',
		disabled,
		ariaLabel = 'Filter by network',
		...rootProps
	}: {
		value?: string[]
		placeholder?: string
		disabled?: boolean
		ariaLabel?: string
		[key: string]: unknown
	} = $props()


	// (Derived)
	const itemsWithGroup = $derived(
		networkFilterGroups
			.filter((g) => g.networks.length > 0)
			.flatMap((group) =>
				group.networks.map((network) => ({ item: network, groupId: group.id, groupLabel: group.label })),
			),
	)
	const items = $derived(itemsWithGroup.map((x) => x.item))
	const groupLabelById = $derived(
		Object.fromEntries(
			networkFilterGroups
				.filter((g) => g.networks.length > 0)
				.map((g) => [g.id, g.label]),
		),
	)
	const uniqueValue = $derived(
		[...new Set((value ?? []).filter((id): id is string => id != null && id !== ''))],
	)


	// Components
	import ComboboxMultiple from '$/components/ComboboxMultiple.svelte'
	import NetworkIcon from '$/views/NetworkIcon.svelte'
</script>



<ComboboxMultiple
	{...rootProps}
	{items}
	bind:value={() => {
		const ids = [...new Set((value ?? []).filter((id): id is string => id != null && id !== ''))]
		return ids
			.map((id) => items.find((n) => String(n.chainId) === id))
			.filter((n): n is Network => n != null && n.chainId != null)
	}, (v: Network[]) => {
		value = [
			...new Set(
				v
					.map((n) => (n.chainId != null ? String(n.chainId) : null))
					.filter((id): id is string => id != null && id !== ''),
			),
		]
	}}
	{placeholder}
	{disabled}
	{ariaLabel}
	getItemId={(n: Network) => String(n.chainId)}
	getItemLabel={(n: Network) => n.name}
	getItemGroupId={(n) =>
		itemsWithGroup.find((x) => x.item.chainId === n.chainId)?.groupId ?? ''
	}
	getGroupLabel={(id) => groupLabelById[id] ?? id}
>
	{#snippet Before()}
		{#if uniqueValue.length > 0}
			<span data-row="start">
				{#each uniqueValue as chainIdStr (chainIdStr)}
					{@const chainId = Number(chainIdStr)}
					{#if !Number.isNaN(chainId)}
						<span class="network-input-icon">
							<NetworkIcon networkId={{ chainId }} />
						</span>
					{/if}
				{/each}
			</span>
		{/if}
	{/snippet}
	{#snippet Item(network, selected)}
		<span data-row="start" data-selected={selected}>
			<span class="network-input-icon">
				<NetworkIcon networkId={{ chainId: network.chainId }} />
			</span>
			<span>{network.name}</span>
		</span>
	{/snippet}
</ComboboxMultiple>


<style>
	.network-input-icon {
		width: 16px;
		height: 16px;
		border-radius: 999px;
	}
</style>
