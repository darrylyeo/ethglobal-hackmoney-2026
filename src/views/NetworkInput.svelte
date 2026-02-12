<script lang="ts">
	// Types/constants
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


	// Components
	import NetworkName from '$/views/NetworkName.svelte'
    import NetworkIcon from '$/views/NetworkIcon.svelte'
	import Select from '$/components/Select.svelte'
	import SelectMultiple from '$/components/SelectMultiple.svelte'
</script>


{#snippet networkIcons()}
	{@const selectedNetworks = multiple ? networks.filter((n) => (Array.isArray(value) ? value : []).includes(n.id)) : (typeof value === 'number' ? [networks.find((n) => n.id === value)].filter(Boolean) : []) as Network[]}
	{#if selectedNetworks.length > 0}
		<span data-row="start gap-2">
			{#each selectedNetworks as network (network.id)}
				<NetworkIcon chainId={network.id} />
			{/each}
		</span>
	{/if}
{/snippet}

{#snippet networkItem(network: Network, selected: boolean)}
	<NetworkName chainId={network.id} />
{/snippet}

{#if multiple}
	<SelectMultiple
		{...rootProps}
		items={networks}
		bind:value={() =>
			(Array.isArray(value)
				? networks.filter((network) => value.includes(network.id))
				: []),
			(nextValue: Network[]) =>
				(value = nextValue
					.map(
						(network) =>
							networks.find((item) => item.id === network.id)?.id ?? null,
					)
					.filter((id): id is Network['id'] => id !== null))}
		{placeholder}
		{disabled}
		{name}
		{id}
		{ariaLabel}
		getItemId={(network) => String(network.id)}
		getItemLabel={(network) => network.name}
		Before={networkIcons}
		Item={networkItem}
	/>
{:else}
	<Select
		{...rootProps}
		items={networks}
		bind:value={() =>
			(typeof value === 'number'
				? networks.find((network) => network.id === value) ?? null
				: null),
			(nextValue: Network | null) =>
				(value =
					networks.find((network) => network.id === nextValue?.id)?.id ??
					null)}
		{placeholder}
		{disabled}
		{name}
		{id}
		{ariaLabel}
		getItemId={(network) => String(network.id)}
		getItemLabel={(network) => network.name}
		Before={networkIcons}
		Item={networkItem}
	/>
{/if}
