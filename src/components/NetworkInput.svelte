<script lang="ts">
	// Types/constants
	import type { Network } from '$/constants/networks'

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
		onValueChange,
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
		onValueChange?: (value: Network['id'] | Network['id'][] | null) => void
		[key: string]: unknown
	} = $props()

	// (Derived)
	const selectedNetworks = $derived(
		multiple
			? networks.filter((network) =>
					Array.isArray(value) && value.includes(network.id),
				)
			: typeof value === 'number'
				? networks.filter((network) => network.id === value)
				: [],
	)
	const comboboxValue = $derived(
		multiple
			? Array.isArray(value)
				? value.map(String)
				: []
			: typeof value === 'number'
				? String(value)
				: '',
	)

	// Functions
	const toNetworkId = (nextValue: string) => (
		networks.find((network) => String(network.id) === nextValue)?.id ?? null
	)
	const isNetworkId = (
		nextValue: Network['id'] | null,
	): nextValue is Network['id'] => (
		nextValue !== null
	)

	// Actions
	const resolveValue = (nextValue: string | string[]) => (
		multiple
			? Array.isArray(nextValue)
				? nextValue.map(toNetworkId).filter(isNetworkId)
				: []
			: typeof nextValue === 'string'
				? toNetworkId(nextValue)
				: null
	)
	const onValueChangeInternal = (nextValue: string | string[]) => (
		onValueChange?.(value = resolveValue(nextValue))
	)

	// Components
	import Combobox from '$/components/Combobox.svelte'
</script>


<Combobox
	{...rootProps}
	items={networks}
	type={multiple ? 'multiple' : 'single'}
	value={comboboxValue}
	{placeholder}
	{disabled}
	{name}
	{id}
	ariaLabel={ariaLabel}
	onValueChange={onValueChangeInternal}
	getItemId={(network) => String(network.id)}
	getItemLabel={(network) => network.name}
>
	{#snippet Before()}
		{#if selectedNetworks.length > 0}
			<span class="network-input-icons">
				{#each selectedNetworks as network (network.id)}
					<img
						class="network-input-icon"
						src={`/networks/${network.id}.svg`}
						alt=""
						width="16"
						height="16"
						loading="lazy"
						decoding="async"
						title={network.name}
					/>
				{/each}
			</span>
		{/if}
	{/snippet}
	{#snippet Item(network, selected)}
		<span
			class="network-input-item"
			data-selected={selected}
		>
			<img
				class="network-input-icon"
				src={`/networks/${network.id}.svg`}
				alt=""
				width="16"
				height="16"
				loading="lazy"
				decoding="async"
			/>
			<span>{network.name}</span>
		</span>
	{/snippet}
</Combobox>


<style>
	.network-input-icons {
		display: inline-flex;
		gap: 0.35rem;
		align-items: center;
	}

	.network-input-item {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
	}

	.network-input-icon {
		width: 16px;
		height: 16px;
		border-radius: 999px;
	}
</style>
