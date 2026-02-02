<script lang="ts">
	// Types/constants
	import type { Coin } from '$/constants/coins'
	import { networksByChainId } from '$/constants/networks'

	// Props
	let {
		coins,
		value = $bindable(coins[0]),
		placeholder = 'Select token',
		disabled,
		name,
		id,
		ariaLabel = 'Token',
		onValueChange,
		...rootProps
	}: {
		coins: readonly [Coin, ...Coin[]]
		value?: Coin | null
		placeholder?: string
		disabled?: boolean
		name?: string
		id?: string
		ariaLabel?: string
		onValueChange?: (value: Coin | null) => void
		[key: string]: unknown
	} = $props()

	// (Derived)
	const comboboxValue = $derived(
		value ? `${value.chainId}-${value.address.toLowerCase()}` : '',
	)

	// Functions
	const toCoinId = (coin: Coin) => (
		`${coin.chainId}-${coin.address.toLowerCase()}`
	)
	const getCoinLabel = (coin: Coin) => (
		`${coin.symbol} (${networksByChainId[coin.chainId]?.name ?? coin.chainId})`
	)
	const resolveValue = (nextValue: string | string[]) => (
		Array.isArray(nextValue)
			? coins.find((coin) => toCoinId(coin) === (nextValue[0] ?? '')) ?? null
			: coins.find((coin) => toCoinId(coin) === nextValue) ?? null
	)

	// Actions
	const onValueChangeInternal = (nextValue: string | string[]) => (
		onValueChange?.(value = resolveValue(nextValue))
	)

	// Components
	import Combobox from '$/components/Combobox.svelte'
</script>


<Combobox
	{...rootProps}
	items={coins}
	type="single"
	value={comboboxValue}
	{placeholder}
	{disabled}
	{name}
	{id}
	ariaLabel={ariaLabel}
	onValueChange={onValueChangeInternal}
	getItemId={toCoinId}
	getItemLabel={getCoinLabel}
>
	{#snippet Item(coin, selected)}
		<span
			class="coin-input-item"
			data-selected={selected}
		>
			<span>{coin.symbol}</span>
			<small data-muted>
				{networksByChainId[coin.chainId]?.name ?? `Chain ${coin.chainId}`}
			</small>
		</span>
	{/snippet}
</Combobox>


<style>
	.coin-input-item {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;

		> small {
			opacity: 0.7;
		}
	}
</style>
