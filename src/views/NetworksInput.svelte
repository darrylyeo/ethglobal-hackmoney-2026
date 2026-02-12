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


	// Components
	import ComboboxMultiple from '$/components/ComboboxMultiple.svelte'
	import NetworkIcon from '$/views/NetworkIcon.svelte'
</script>


{#snippet networkIcons()}
	{#if value.length > 0}
		<span data-row="start gap-2">
			{#each value as chainIdStr (chainIdStr)}
				{@const chainId = Number(chainIdStr)}
				{#if !Number.isNaN(chainId)}
					<span class="network-input-icon">
						<NetworkIcon {chainId} />
					</span>
				{/if}
			{/each}
		</span>
	{/if}
{/snippet}

{#snippet networkItem(network: Network, selected: boolean)}
	<span data-row="start gap-2" data-selected={selected}>
		<span class="network-input-icon">
			<NetworkIcon chainId={network.id} />
		</span>
		<span>{network.name}</span>
	</span>
{/snippet}

<ComboboxMultiple
	{...rootProps}
	{items}
	bind:value={() =>
		(value ?? []).map((id) => items.find((n) => String(n.id) === id)).filter(Boolean) as Network[],
		(v: Network[]) => (value = v.map((n) => String(n.id)))
	}
	{placeholder}
	{disabled}
	{ariaLabel}
	getItemId={(n: Network) => String(n.id)}
	getItemLabel={(n: Network) => n.name}
	getItemGroupId={(n) =>
		itemsWithGroup.find((x) => x.item.id === n.id)?.groupId ?? ''
	}
	getGroupLabel={(id) => groupLabelById[id] ?? id}
	Before={networkIcons}
	Item={networkItem}
/>


<style>
	.network-input-icon {
		width: 16px;
		height: 16px;
		border-radius: 999px;
	}
</style>
