<script lang="ts">
	// Types/constants
	import { networkConfigsByChainId } from '$/constants/networks'
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

	// Components
	import Select from '$/components/Select.svelte'
	import Icon from '$/components/Icon.svelte'
</script>


{#snippet networkIcons()}
	{@const selectedNetworks = (
		multiple
			? networks.filter((network) =>
					Array.isArray(value) && value.includes(network.id),
				)
			: typeof value === 'number'
				? networks.filter((network) => network.id === value)
				: []
	)}
	{#if selectedNetworks.length > 0}
		<span class="network-input-icons">
			{#each selectedNetworks as network (network.id)}
				<span class="network-input-icon">
					<Icon
						src={networkConfigsByChainId[network.id]?.icon ?? `/networks/${network.id}.svg`}
						alt=""
						size={16}
						loading="lazy"
						decoding="async"
						title={network.name}
					/>
				</span>
			{/each}
		</span>
	{/if}
{/snippet}

{#snippet networkItem(network: Network, selected: boolean)}
	<span
		class="network-input-item"
		data-selected={selected}
	>
		<span class="network-input-icon">
			<Icon
				src={networkConfigsByChainId[network.id]?.icon ?? `/networks/${network.id}.svg`}
				alt=""
				size={16}
				loading="lazy"
				decoding="async"
			/>
		</span>
		<span>{network.name}</span>
	</span>
{/snippet}

<Select
	{...rootProps}
	items={networks}
	type={multiple ? 'multiple' : 'single'}
	value={multiple
		? Array.isArray(value)
			? value.map(String)
			: []
		: typeof value === 'number'
			? String(value)
			: ''}
	{placeholder}
	{disabled}
	{name}
	{id}
	ariaLabel={ariaLabel}
	onValueChange={(nextValue) => (
		onValueChange?.(
			value = multiple
				? Array.isArray(nextValue)
					? nextValue
							.map((id) =>
								networks.find((network) => String(network.id) === id)?.id ??
									null)
							.filter((id): id is Network['id'] => id !== null)
					: []
				: typeof nextValue === 'string'
					? networks.find((network) => String(network.id) === nextValue)?.id ??
						null
					: null,
		)
	)}
	getItemId={(network) => String(network.id)}
	getItemLabel={(network) => network.name}
	Before={networkIcons}
	Item={networkItem}
>
</Select>


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
