<script lang="ts">
	// Types/constants
	import type { Coin } from '$/constants/coins'
	import { CoinType } from '$/constants/coins'
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
		value
			? `${value.chainId}-${value.type}-${
					value.type === CoinType.Native
						? 'native'
					:
						value.address.toLowerCase()
				}`
			: '',
	)

	// Functions
	const toCoinId = (coin: Coin) => (
		`${coin.chainId}-${coin.type}-${
			coin.type === CoinType.Native
				? 'native'
			:
				coin.address.toLowerCase()
		}`
	)
	const getCoinLabel = (coin: Coin) => (
		`${coin.symbol} (${networksByChainId[coin.chainId]?.name ?? coin.chainId} · ${
			coin.type === CoinType.Native ? 'Native' : 'ERC-20'
		})`
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
		{@const iconUrl =
			coin.icon?.original?.url ??
			coin.icon?.thumbnail?.url ??
			coin.icon?.low?.url}
		{@const typeLabel = coin.type === CoinType.Native ? 'Native' : 'ERC-20'}
		<span
			class="coin-input-item"
			data-selected={selected}
		>
			{#if iconUrl}
				<img src={iconUrl} alt={coin.symbol} width="16" height="16" />
			{:else}
				<span class="coin-input-placeholder" aria-hidden="true"></span>
			{/if}
			<span>{coin.symbol}</span>
			<small data-muted>
				{networksByChainId[coin.chainId]?.name ?? `Chain ${coin.chainId}`}
				·
				{typeLabel}
			</small>
		</span>
	{/snippet}
</Combobox>


<style>
	.coin-input-item {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		min-height: 1.5rem;

		> small {
			opacity: 0.7;
		}

		> img,
		> .coin-input-placeholder {
			width: 1rem;
			height: 1rem;
			border-radius: 999px;
		}

		> .coin-input-placeholder {
			background: var(--color-border);
		}
	}
</style>
