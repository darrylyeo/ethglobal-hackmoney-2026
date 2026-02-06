<script lang="ts">


	// Types/constants
	import { networkConfigsByChainId } from '$/constants/networks.ts'
	import type { Network } from '$/constants/networks.ts'


	// Props
	let {
		networks,
		multiple = false,
		value = $bindable(multiple ? [] : null),
		placeholder = 'Select network',
		disabled,
		name,
		id,
		ariaLabel = 'Network',
		...rootProps
	}: {
		networks: readonly Network[]
		value?: Network['id'] | Network['id'][] | null
		multiple?: boolean
		placeholder?: string
		disabled?: boolean
		name?: string
		id?: string
		ariaLabel?: string
		[key: string]: unknown
	} = $props()


	// (Derived)














































































































	// Components
	import Select from '$/components/Select.svelte'
	import Icon from '$/components/Icon.svelte'
</script>

{#snippet networkIcons()}
	{@const selectedNetworks = multiple
		? networks.filter(
				(network) => Array.isArray(value) && value.includes(network.id),
			)
		: typeof value === 'number'
			? networks.filter((network) => network.id === value)
			: []}
	{#if selectedNetworks.length > 0}
		<span data-row="start gap-2">
			{#each selectedNetworks as network (network.id)}
				{@const icon = networkConfigsByChainId[network.id]?.icon}
				<span class="network-input-icon">
					{#if icon}
						<Icon src={icon} size={16} title={network.name} />
					{/if}
				</span>
			{/each}
		</span>
	{/if}
{/snippet}

{#snippet networkItem(network: Network, selected: boolean)}
	{@const icon = networkConfigsByChainId[network.id]?.icon}
	<span data-row="start gap-2" data-selected={selected}>
		<span class="network-input-icon">
			{#if icon}
				<Icon src={icon} size={16} />
			{/if}
		</span>
		<span>{network.name}</span>
	</span>
{/snippet}

<Select
	{...rootProps}
	items={networks}
	type={multiple ? 'multiple' : 'single'}
	bind:value={() =>
		multiple
			? Array.isArray(value)
				? value.map(String)
				: []
			: typeof value === 'number'
				? String(value)
				: '', (nextValue: string | string[]) =>
		(value = multiple
			? Array.isArray(nextValue)
				? nextValue
						.map(
							(id) =>
								networks.find((network) => String(network.id) === id)?.id ??
								null,
						)
						.filter((id): id is Network['id'] => id !== null)
				: []
			: typeof nextValue === 'string'
				? (networks.find((network) => String(network.id) === nextValue)?.id ??
					null)
				: null)}
	{placeholder}
	{disabled}
	{name}
	{id}
	{ariaLabel}
	getItemId={(network) => String(network.id)}
	getItemLabel={(network) => network.name}
	Before={networkIcons}
	Item={networkItem}
></Select>


<style>
	.network-input-icon {
		width: 16px;
		height: 16px;
		border-radius: 999px;
	}
</style>
