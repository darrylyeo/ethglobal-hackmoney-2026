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
		...rootProps
	}: {
		coins: readonly [Coin, ...Coin[]]
		value?: Coin | null
		placeholder?: string
		disabled?: boolean
		name?: string
		id?: string
		ariaLabel?: string
		[key: string]: unknown
	} = $props()


	// Functions
	const toCoinId = (coin: Coin) =>
		`${coin.chainId}-${coin.type}-${
			coin.type === CoinType.Native ? 'native' : coin.address.toLowerCase()
		}`
	const coinIconUrl = (coin: Coin) =>
		coin.icon?.original?.url ??
		coin.icon?.thumbnail?.url ??
		coin.icon?.low?.url


	// Components
	import Combobox from '$/components/Combobox.svelte'
	import Icon from '$/components/Icon.svelte'
</script>


{#snippet selectedCoinIcon()}
	{#if value}
		{@const iconUrl = coinIconUrl(value)}
		{#if iconUrl}
			<span class="coin-input-icon">
				<Icon src={iconUrl} alt={value.symbol} size="1rem" />
			</span>
		{:else}
			<span class="coin-input-placeholder" aria-hidden="true"></span>
		{/if}
	{/if}
{/snippet}

<Combobox
	{...rootProps}
	items={coins}
	type="single"
	bind:value={() =>
		value
			? `${value.chainId}-${value.type}-${
					value.type === CoinType.Native ? 'native' : value.address.toLowerCase()
				}`
			: '', (nextValue: string | string[]) =>
		(value = Array.isArray(nextValue)
			? (coins.find((coin) => toCoinId(coin) === (nextValue[0] ?? '')) ?? null)
			: (coins.find((coin) => toCoinId(coin) === nextValue) ?? null))}
	{placeholder}
	{disabled}
	{name}
	{id}
	{ariaLabel}
	getItemId={toCoinId}
	getItemLabel={(coin) => coin.symbol}
	Before={selectedCoinIcon}
>
	{#snippet Item(coin, selected)}
		{@const iconUrl = coinIconUrl(coin)}
		<span data-row="start gap-2" class="coin-input-item" data-selected={selected}>
			{#if iconUrl}
				<span class="coin-input-icon">
					<Icon src={iconUrl} alt={coin.symbol} size="1rem" />
				</span>
			{:else}
				<span class="coin-input-placeholder" aria-hidden="true"></span>
			{/if}
			<span>{coin.symbol}</span>
			{#if coin.name}
				<span data-muted>{coin.name}</span>
			{/if}
			<small data-muted>
				{networksByChainId[coin.chainId]?.name ?? `Chain ${coin.chainId}`}
				·
				{coin.type === CoinType.Native ? 'Native' : 'ERC-20'}
			</small>
		</span>
	{/snippet}
</Combobox>


<style>
	.coin-input-item {
		min-height: 1.5rem;

		> small {
			opacity: 0.7;
		}

		> .coin-input-icon,
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
