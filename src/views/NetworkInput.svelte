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
				<NetworkIcon chainId={network.id} size={16} />
			{/each}
		</span>
	{/if}
{/snippet}

{#snippet networkItem(network: Network, selected: boolean)}
	<NetworkName chainId={network.id} />
{/snippet}

{#if multiple}
	<Select
		{...rootProps}
		items={networks}
		type="multiple"
		bind:value={() =>
			(Array.isArray(value) ? value.map(String) : []),
			(nextValue: string[]) =>
				(value = nextValue
					.map(
						(id) =>
							networks.find((network) => String(network.id) === id)?.id ?? null,
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
		type="single"
		bind:value={() =>
			(typeof value === 'number' ? String(value) : ''),
			(nextValue: string) =>
				(value =
					networks.find((network) => String(network.id) === nextValue)?.id ??
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
