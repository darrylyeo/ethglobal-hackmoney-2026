<script lang="ts">
	// Types/constants
	import type { Coin } from '$/constants/coins.ts'
	import { CoinType } from '$/constants/coins.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { getCoinIconUrl } from '$/lib/coin-icon.ts'


	// Props
	let {
		coins,
		value = $bindable(),
		placeholder = 'Select token',
		showNetworksAndProtocols = false,
		disabled,
		name,
		id,
		ariaLabel = 'Token',
		...rootProps
	}: {
		coins: readonly [Coin, ...Coin[]]
		value?: Coin | undefined
		placeholder?: string
		showNetworksAndProtocols?: boolean
		disabled?: boolean
		name?: string
		id?: string
		ariaLabel?: string
		[key: string]: unknown
	} = $props()


	// State
	let iconUrls = $state<Record<string, string>>({})


	// Functions
	const toCoinId = (coin: Coin) =>
		`${coin.chainId}-${coin.type}-${
			coin.type === CoinType.Native ? 'native' : coin.address
		}`
	const coinIconUrl = (coin: Coin) =>
		iconUrls[coin.symbol] ??
		coin.icon?.original?.url ??
		coin.icon?.thumbnail?.url ??
		coin.icon?.low?.url


	// Components
	import CoinIcon from '$/views/CoinIcon.svelte'
	import Select from '$/components/Select.svelte'


	// (Derived)
	$effect(() => {
		const symbols = new Set([
			...(value?.symbol ? [value.symbol] : []),
			...coins.map((c) => c.symbol),
		])
		for (const symbol of symbols) {
			if (iconUrls[symbol]) continue
			getCoinIconUrl(symbol).then((url) => {
				iconUrls = { ...iconUrls, [symbol]: url }
			})
		}
	})
</script>


<Select
	{...rootProps}
	items={coins}
	bind:value
	getItemId={toCoinId}
	getItemLabel={(coin) => coin.symbol}
	{placeholder}
	{disabled}
	{name}
	{id}
	{ariaLabel}
>
	{#snippet Before()}
		{#if value}
			{@const iconUrl = coinIconUrl(value)}
			{#if iconUrl}
				<span class="coin-input-icon">
					<CoinIcon
						src={iconUrl}
						symbol={value.symbol}
						alt={value.symbol}
					/>
				</span>
			{:else}
				<span class="coin-input-placeholder" aria-hidden="true"></span>
			{/if}
		{/if}
	{/snippet}
	{#snippet Item(coin, selected)}
		{@const iconUrl = coinIconUrl(coin)}
		<span data-row="start gap-2" class="coin-input-item" data-selected={selected}>
			{#if iconUrl}
				<span class="coin-input-icon">
					<CoinIcon
						src={iconUrl}
						symbol={coin.symbol}
						alt={coin.symbol}
					/>
				</span>
			{:else}
				<span class="coin-input-placeholder" aria-hidden="true"></span>
			{/if}
			<span>{coin.symbol}</span>
			{#if coin.name}
				<span data-text="muted">{coin.name}</span>
			{/if}
			{#if showNetworksAndProtocols}
				<small data-text="muted">
					{networksByChainId[coin.chainId]?.name ?? `Chain ${coin.chainId}`}
					·
					{coin.type === CoinType.Native ? 'Native' : 'ERC-20'}
				</small>
			{/if}
		</span>
	{/snippet}
</Select>


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
