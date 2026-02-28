<script lang="ts">
	// Types/constants
	import { CoinInstanceType, type CoinInstance } from '$/constants/coin-instances.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { CoinId, coinById } from '$/constants/coins.ts'


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
		coins: readonly [CoinInstance, ...CoinInstance[]]
		value?: CoinInstance | undefined
		placeholder?: string
		showNetworksAndProtocols?: boolean
		disabled?: boolean
		name?: string
		id?: string
		ariaLabel?: string
		[key: string]: unknown
	} = $props()


	// Functions
	const toCoinId = (coin: CoinInstance) =>
		`${coin.$id.$network.chainId}-${coin.type}-${
			coin.type === CoinInstanceType.NativeCurrency ? 'native' : coin.$id.address
		}`
	const iconUrls = $derived.by(() => {
		const ids = new Set([
			...(value?.coinId != null ? [value.coinId] : []),
			...coins.map((c) => c.coinId),
		])
		const ethIcon = coinById[CoinId.ETH]?.icon ?? ''
		return Object.fromEntries(
			[...ids].map((id) => [id, coinById[id]?.icon ?? ethIcon]),
		)
	})
	const coinIconUrl = (coin: CoinInstance) =>
		(coin.coinId != null ? iconUrls[coin.coinId] : undefined) ??
		coin.icon?.original?.url ??
		coin.icon?.thumbnail?.url ??
		coin.icon?.low?.url


	// Components
	import Select from '$/components/Select.svelte'
	import CoinIcon from '$/views/CoinIcon.svelte'
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
						coin={coinById[value.coinId]!}
						src={iconUrl}
						alt={value.symbol}
					/>
				</span>
			{:else}
				<span
					class="coin-input-placeholder"
					aria-hidden="true"
				></span>
			{/if}
		{/if}
	{/snippet}

	{#snippet Item(coin, selected)}
		{@const iconUrl = coinIconUrl(coin)}

		{@const symbol = coin.symbol}

		<span
			data-row="start"
			class="coin-input-item"
			data-selected={selected}
		>
			{#if iconUrl}
				<span class="coin-input-icon">
					<CoinIcon
						coin={coinById[coin.coinId]!}
						src={iconUrl}
						alt={symbol}
					/>
				</span>
			{:else}
				<span
					class="coin-input-placeholder"
					aria-hidden="true"
				></span>
			{/if}

			<span>{symbol}</span>
			{#if coin.name}
				<span data-text="muted">{coin.name}</span>
			{/if}

			{#if showNetworksAndProtocols}
				<small data-text="muted">
					{networksByChainId[coin.$id.$network.chainId]?.name ?? `Chain ${coin.$id.$network.chainId}`}
					·
					{coin.type === CoinInstanceType.NativeCurrency ? 'Native' : 'ERC-20'}
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
