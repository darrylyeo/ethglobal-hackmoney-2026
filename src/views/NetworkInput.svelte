<script lang="ts">
	// Types/constants
	import type { ChainId, Network } from '$/constants/networks.ts'


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
		value?: ChainId | ChainId[] | null
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


{#if multiple}
	<SelectMultiple
		{...rootProps}
		items={networks}
		bind:value={() => {
				const ids: ChainId[] = Array.isArray(value) ? value : []
				return networks.filter((network) => ids.includes(network.chainId))
			},
			(nextValue: Network[]) =>
				(value = nextValue
					.map(
						(network) =>
							networks.find((item) => item.chainId === network.chainId)?.chainId ?? null,
					)
					.filter((id): id is ChainId => id !== null))}
		getItemId={(network) => String(network.chainId)}
		getItemLabel={(network) => network.name}
		{placeholder}
		{disabled}
		{name}
		{id}
		{ariaLabel}
	>
		{#snippet Before()}
			{@const selectedNetworks = multiple ? networks.filter((n) => (Array.isArray(value) ? value : []).includes(n.chainId)) : (typeof value === 'number' ? [networks.find((n) => n.chainId === value)].filter(Boolean) : []) as Network[]}
			{#if selectedNetworks.length > 0}
				<span data-row="start">
					{#each selectedNetworks as network (network.chainId)}
						<NetworkIcon networkId={{ chainId: network.chainId }} />
					{/each}
				</span>
			{/if}
		{/snippet}

		{#snippet Item(network, selected)}
			<NetworkName networkId={{ chainId: network.chainId }} />
		{/snippet}
	</SelectMultiple>
{:else}
	<Select
		{...rootProps}
		items={networks}
		bind:value={() =>
			(typeof value === 'number'
				? networks.find((network) => network.chainId === value) ?? undefined
				: undefined),
			(nextValue: Network | undefined) =>
				(value =
					nextValue == null
						? null
						: (networks.find((network) => network.chainId === nextValue?.chainId)?.chainId ?? null))}
		getItemId={(network) => String(network.chainId)}
		getItemLabel={(network) => network.name}
		{placeholder}
		{disabled}
		{name}
		{id}
		{ariaLabel}
	>
		{#snippet Before()}
			{@const selectedNetworks = multiple ? networks.filter((n) => (Array.isArray(value) ? value : []).includes(n.chainId)) : (typeof value === 'number' ? [networks.find((n) => n.chainId === value)].filter(Boolean) : []) as Network[]}
			{#if selectedNetworks.length > 0}
				<span data-row="start">
					{#each selectedNetworks as network (network.chainId)}
						<NetworkIcon networkId={{ chainId: network.chainId }} />
					{/each}
				</span>
			{/if}
		{/snippet}

		{#snippet Item(network, selected)}
			<NetworkName networkId={{ chainId: network.chainId }} />
		{/snippet}
	</Select>
{/if}
