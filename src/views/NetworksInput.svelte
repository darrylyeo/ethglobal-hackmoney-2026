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
	const groupedItems = $derived(
		networkFilterGroups
			.filter((g) => g.networks.length > 0)
			.map((group) => ({
				id: group.id,
				label: group.label,
				items: [...group.networks],
			})),
	)


	// Components
	import Combobox from '$/components/Combobox.svelte'
	import NetworkIcon from '$/views/NetworkIcon.svelte'
</script>

{#snippet networkIcons()}
	{#if Array.isArray(value) && value.length > 0}
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

<Combobox
	{...rootProps}
	type="multiple"
	items={groupedItems}
	bind:value
	{placeholder}
	{disabled}
	{ariaLabel}
	getItemId={(n: Network) => String(n.id)}
	getItemLabel={(n: Network) => n.name}
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
