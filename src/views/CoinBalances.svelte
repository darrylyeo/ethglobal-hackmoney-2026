<script lang="ts">
	// Types/constants
	import { BalanceDisplayType } from '$/views/balance-display-type.ts'
	import { CoinType, ercTokens } from '$/constants/coins.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { MediaType } from '$/constants/media.ts'
	import {
		networkConfigsByChainId,
		networksByChainId,
	} from '$/constants/networks.ts'
	type DisplayToken = (typeof displayTokens)[number]


	// Context
	import { and, eq, or, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let {
		selectedActor,
		balanceTokens = [],
		filterChainIds = $bindable([] as string[]),
		filterSymbols = $bindable([] as string[]),
		filterAddresses = $bindable([] as `0x${string}`[]),
		availableAccounts = [],
		displayType = BalanceDisplayType.Card,
	}: {
		selectedActor: `0x${string}` | null
		balanceTokens?: {
			chainId: number
			tokenAddress: `0x${string}`
		}[]
		filterChainIds?: string[]
		filterSymbols?: string[]
		filterAddresses?: `0x${string}`[]
		availableAccounts?: `0x${string}`[]
		displayType?: BalanceDisplayType
	} = $props()


	// Functions
	import { intentDraggable } from '$/lib/intents/intentDraggable.svelte.ts'
	import { formatSmallestToDecimal } from '$/lib/format.ts'
	import { getStorkAssetIdForSymbol } from '$/lib/stork.ts'


	// State
	import { actorCoinsCollection } from '$/collections/actor-coins.ts'
	import {
		storkPricesCollection,
		subscribeStorkPrices,
		getBestStorkPrice,
	} from '$/collections/stork-prices.ts'
	import { tokenListCoinsCollection } from '$/collections/token-list-coins.ts'


	// (Derived)
	const normalizedBalanceTokens = $derived([
		...new Map(
			balanceTokens.map((token) => [
				`${token.chainId}:${token.tokenAddress.toLowerCase()}`,
				token,
			]),
		).values(),
	])
	const tokenListQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: tokenListCoinsCollection })
				.where(({ row }) => eq(row.$source, DataSource.TokenLists))
				.where(({ row }) =>
					normalizedBalanceTokens.length > 0
						? normalizedBalanceTokens
								.map((token) =>
									and(
										eq(row.chainId, token.chainId),
										eq(row.address, token.tokenAddress),
									),
								)
								.reduce((acc, filter) => or(acc, filter))
						: and(eq(row.chainId, -1), eq(row.chainId, 0)),
				)
				.select(({ row }) => ({ row })),
		[() => normalizedBalanceTokens],
	)
	const filteredTokenListCoins = $derived(
		(tokenListQuery.data ?? []).map((r) => r.row),
	)
	const fallbackTokens = $derived(
		balanceTokens
			.map((token) =>
				ercTokens.find(
					(entry) =>
						entry.chainId === token.chainId &&
						entry.address.toLowerCase() === token.tokenAddress.toLowerCase(),
				),
			)
			.flatMap((token) => (token ? [token] : [])),
	)
	const displayTokens = $derived(
		(filteredTokenListCoins.length > 0
			? filteredTokenListCoins
			: fallbackTokens
		).map((token) => ({
			...token,
			name: 'name' in token ? token.name : token.symbol,
			logoURI: 'logoURI' in token ? token.logoURI : undefined,
		})),
	)
	const skeletonTokens = $derived(
		displayTokens.length > 0 ? displayTokens.slice(0, 6) : [],
	)
	const skeletonRows: (DisplayToken | null)[] = $derived(
		skeletonTokens.length > 0
			? skeletonTokens
			: Array.from({ length: 6 }, () => null),
	)
	const balanceTokenListCoins = $derived(
		displayTokens.map((token) => ({
			chainId: token.chainId,
			address: token.address,
			symbol: token.symbol,
			decimals: token.decimals,
		})),
	)
	const actors = $derived(
		filterAddresses.length > 0
			? filterAddresses
			: selectedActor
				? [selectedActor]
				: [],
	)
	const filterChainIdsNum = $derived(
		filterChainIds.map((id) => Number(id)).filter((n) => !Number.isNaN(n)),
	)
	const balancesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: actorCoinsCollection })
				.where(({ row }) => {
					const addrCondition =
						actors.length === 0
							? and(
									eq(row.$id.address, '0x0000000000000000000000000000000000000000'),
									eq(row.$id.address, '0x0000000000000000000000000000000000000001'),
								)
							: actors.length === 1
								? eq(row.$id.address, actors[0])
								: actors
										.map((a) => eq(row.$id.address, a))
										.reduce((acc, cond) => or(acc, cond))
					const tokenCondition =
						displayTokens.length > 0
							? displayTokens
									.map((token) =>
										and(
											eq(row.$id.chainId, token.chainId),
											eq(row.$id.tokenAddress, token.address),
										),
									)
									.reduce((acc, filter) => or(acc, filter))
							: and(eq(row.$id.chainId, -1), eq(row.$id.chainId, 0))
					const chainCondition =
						filterChainIdsNum.length > 0
							? filterChainIdsNum
									.map((c) => eq(row.$id.chainId, c))
									.reduce((acc, cond) => or(acc, cond))
							: null
					const symbolCondition =
						filterSymbols.length > 0
							? filterSymbols
									.map((s) => eq(row.symbol, s))
									.reduce((acc, cond) => or(acc, cond))
							: null
					return and(
						eq(row.$source, DataSource.Voltaire),
						addrCondition,
						tokenCondition,
						...(chainCondition ? [chainCondition] : []),
						...(symbolCondition ? [symbolCondition] : []),
					)
				})
				.select(({ row }) => ({ row })),
		[() => actors, () => displayTokens, () => filterChainIdsNum, () => filterSymbols],
	)
	const pricesQuery = useLiveQuery((q) =>
		q
			.from({ row: storkPricesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Stork))
			.select(({ row }) => ({ row })),
	)
	const liveQueryEntries = [
		{
			id: 'balances-token-list',
			label: 'Token List',
			query: tokenListQuery,
		},
		{
			id: 'balances-actor-coins',
			label: 'Actor Coins',
			query: balancesQuery,
		},
		{
			id: 'balances-stork-prices',
			label: 'Stork Prices',
			query: pricesQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const balances = $derived((balancesQuery.data ?? []).map((r) => r.row))
	const prices = $derived((pricesQuery.data ?? []).map((r) => r.row))
	const balanceAssetIds = $derived([
		...new Set(
			balances.flatMap((balance) => {
				const assetId = getStorkAssetIdForSymbol(balance.symbol)
				return assetId ? [assetId] : []
			}),
		),
	])
	const balanceChainIds = $derived([
		...new Set(balances.map((balance) => balance.$id.chainId)),
	])
	const netWorthUsd = $derived(
		balances.length > 0
			? balances.reduce((total, balance) => {
					const assetId = getStorkAssetIdForSymbol(balance.symbol)
					if (!assetId) return total
					const priceRow = getBestStorkPrice(
						prices,
						assetId,
						balance.$id.chainId,
					)
					if (!priceRow) return total
					return (
						total +
						(balance.balance * priceRow.price) / 10n ** BigInt(balance.decimals)
					)
				}, 0n)
			: null,
	)
	const networkFilterOptions = $derived(
		[...new Set(balanceTokenListCoins.map((t) => t.chainId))].map((chainId) => ({
			chainId,
			name: networkConfigsByChainId[chainId]?.name ?? `Chain ${chainId}`,
		})),
	)
	const symbolFilterOptions = $derived(
		[...new Set(balanceTokenListCoins.map((t) => t.symbol))].sort(),
	)
	const singleNetwork = $derived(
		filterChainIdsNum.length === 1 ? filterChainIdsNum[0] : null,
	)
	const singleSymbol = $derived(
		filterSymbols.length === 1 ? filterSymbols[0] : null,
	)
	const singleAddress = $derived(
		filterAddresses.length === 1 ? filterAddresses[0] : null,
	)
	const hasAnyFilter = $derived(
		filterChainIdsNum.length > 0 ||
			filterSymbols.length > 0 ||
			filterAddresses.length > 0,
	)
	const useDynamicTitle = $derived(
		hasAnyFilter &&
			filterChainIdsNum.length <= 1 &&
			filterSymbols.length <= 1 &&
			filterAddresses.length <= 1,
	)
	const balancesTitlePrefix = $derived(
		useDynamicTitle
			? (() => {
					const symbolPart =
						singleSymbol !== null ? `${singleSymbol} Balances` : 'Balances'
					const networkPart =
						singleNetwork !== null
							? ` on ${networkConfigsByChainId[singleNetwork]?.name ?? `Chain ${singleNetwork}`}`
							: ''
					const accountPart = singleAddress !== null ? ' for ' : ''
					return symbolPart + networkPart + accountPart
				})()
			: 'Balances',
	)


	// Actions
	$effect(() => {
		const assetIds = balanceAssetIds
		if (assetIds.length === 0) return
		const unsubscribers = [
			subscribeStorkPrices({ assetIds, transports: ['rest', 'websocket'] }),
			...balanceChainIds.map((chainId) =>
				subscribeStorkPrices({ assetIds, chainId, transports: ['rpc'] }),
			),
		]
		return () => {
			for (const unsubscribe of unsubscribers) unsubscribe()
		}
	})


	// Components
	import Boundary from '$/components/Boundary.svelte'
	import Combobox from '$/components/Combobox.svelte'
	import Icon from '$/components/Icon.svelte'
	import CoinsInput from '$/views/CoinsInput.svelte'
	import NetworksInput from '$/views/NetworksInput.svelte'
	import Skeleton from '$/components/Skeleton.svelte'
	import TruncatedValue, {
		TruncatedValueFormat,
	} from '$/components/TruncatedValue.svelte'
	import CoinAmount from '$/views/CoinAmount.svelte'
</script>


	{#if actors.length > 0}
		<details class="balances" data-card data-scroll-container open>
			<summary class="balances-summary">
				<div data-row="gap-2 align-center">
					<h3 data-row-item="flexible" class="section-heading">
						{balancesTitlePrefix}{#if singleAddress}<TruncatedValue
							value={singleAddress}
							startLength={6}
							endLength={4}
							format={TruncatedValueFormat.Abbr}
						/>{/if}
					</h3>
					{#if balances.length > 0 && prices.length > 0 && netWorthUsd !== null}
						<span class="net-worth">
							Total value ≈ ${formatSmallestToDecimal(netWorthUsd, 18, 2)}
						</span>
					{/if}
				</div>
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					class="balances-filters"
					role="group"
					aria-label="Filters"
					data-row="gap-2 wrap align-center"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
				>
					<NetworksInput
						bind:value={filterChainIds}
						placeholder="Network"
						ariaLabel="Filter by network"
					/>
					<CoinsInput
						bind:value={filterSymbols}
						items={symbolFilterOptions}
						placeholder="Coin"
						ariaLabel="Filter by coin"
					/>
					{#if availableAccounts.length > 0}
						<Combobox
							type="multiple"
							items={availableAccounts}
							bind:value={filterAddresses}
							placeholder="Account"
							ariaLabel="Filter by account"
							getItemId={(addr) => addr}
							getItemLabel={(addr) =>
								`${addr.slice(0, 6)}…${addr.slice(-4)}`}
						/>
					{/if}
				</div>
			</summary>
			<Boundary>
				{#if balancesQuery.isLoading && balances.length === 0}
					<div data-balances data-grid="columns-autofit column-min-8 gap-3" data-balances-skeleton>
						{#each skeletonRows as token, i (i)}
							{@const coin = token
								? {
										type: CoinType.Erc20,
										chainId: token.chainId,
										address: token.address,
										symbol: token.symbol,
										name: token.name,
										decimals: token.decimals,
										icon: token.logoURI
											? {
													type: MediaType.Image,
													original: {
														url: token.logoURI,
													},
												}
											: undefined,
									}
								: null}
							<div
								class="balance-item balance-item-skeleton"
								data-card
								data-column
								data-display-type={displayType}
							>
								<Skeleton width="4em" height="0.75em" rounded="0.2em" />
								<div data-row="start gap-2">
									{#if coin}
										<CoinAmount
											{coin}
											draggable={false}
											showLabel={false}
											showPriceTooltip={false}
										/>
									{:else}
										<Skeleton width="2.5em" height="1.25em" rounded="0.25em" />
									{/if}
									<Skeleton width="5em" height="1.25em" rounded="0.25em" />
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div data-balances data-grid="columns-autofit column-min-8 gap-3">
						{#each balances as b (b.$id.chainId + ':' + b.$id.tokenAddress)}
							{@const token = displayTokens.find(
								(entry) =>
									entry.chainId === b.$id.chainId &&
									entry.address.toLowerCase() ===
										b.$id.tokenAddress.toLowerCase(),
							)}
							{@const assetId = getStorkAssetIdForSymbol(b.symbol)}
							{@const priceRow = assetId
								? getBestStorkPrice(prices, assetId, b.$id.chainId)
								: null}
							{@const balanceUsdValue = priceRow
								? (b.balance * priceRow.price) / 10n ** BigInt(b.decimals)
								: null}
							{@const coin = token
								? {
										type: CoinType.Erc20,
										chainId: token.chainId,
										address: token.address,
										symbol: token.symbol,
										name: token.name,
										decimals: token.decimals,
										icon: token.logoURI
											? {
													type: MediaType.Image,
													original: {
														url: token.logoURI,
													},
												}
											: undefined,
									}
								: {
										type: CoinType.Erc20,
										chainId: b.$id.chainId,
										address: b.$id.tokenAddress,
										symbol: b.symbol,
										decimals: b.decimals,
									}}
							{@const network = networksByChainId[b.$id.chainId]}
							{#if network}
								<div
									class="balance-item"
									data-balance-item
									data-card
									data-column
									data-display-type={displayType}
									data-text="font-monospace"
									role="term"
									{@attach intentDraggable({
										type: EntityType.ActorCoin,
										id: b.$id,
										text: `${b.symbol} ${b.$id.address}`,
										source: 'balances',
									})}
								>
									<dt data-row="start gap-1 align-center">
										{network.name}
										{#if actors.length > 1}
											<span data-muted class="balance-address">
												{b.$id.address.slice(0, 6)}…{b.$id.address.slice(-4)}
											</span>
										{/if}
									</dt>
									{#if b.isLoading}
										<span class="balance-loading" data-row="start gap-2" aria-busy="true">
											<Skeleton width="6em" height="1.25em" rounded="0.25em" />
										</span>
									{:else if b.error}
										<span class="balance-error" data-balance-error>{b.error}</span>
									{:else}
										<CoinAmount
											{coin}
											amount={b.balance}
											draggable={false}
											symbolOnly
											{priceRow}
										/>
										{#if balanceUsdValue !== null}
											<small data-muted>
												≈ ${formatSmallestToDecimal(balanceUsdValue, 18, 2)}
											</small>
										{/if}
									{/if}
								</div>
							{/if}
						{/each}
					</div>
				{/if}

				{#snippet Pending()}
					<div data-balances data-grid="columns-autofit column-min-8 gap-3" data-balances-skeleton>
						{#each skeletonRows as token, i (i)}
							{@const coin = token
								? {
										type: CoinType.Erc20,
										chainId: token.chainId,
										address: token.address,
										symbol: token.symbol,
										name: token.name,
										decimals: token.decimals,
										icon: token.logoURI
											? {
													type: MediaType.Image,
													original: {
														url: token.logoURI,
													},
												}
											: undefined,
									}
								: null}
							<div
								class="balance-item balance-item-skeleton"
								data-card
								data-column
								data-display-type={displayType}
							>
								<Skeleton width="4em" height="0.75em" rounded="0.2em" />
								<div data-row="start gap-2">
									{#if coin}
										<CoinAmount
											{coin}
											draggable={false}
											showLabel={false}
											showPriceTooltip={false}
										/>
									{:else}
										<Skeleton width="2.5em" height="1.25em" rounded="0.25em" />
									{/if}
									<Skeleton width="5em" height="1.25em" rounded="0.25em" />
								</div>
							</div>
						{/each}
					</div>
				{/snippet}
			</Boundary>
		</details>
	{/if}


<style>
	.section-heading {
		font-size: 1rem;
		margin: 0;
	}

	.balance-address {
		font-size: 0.9em;
	}

	.balance-loading {
		font-size: 0.875em;
		opacity: 0.8;
	}

	.balance-item-skeleton {
		pointer-events: none;
	}

	.balance-error {
		font-size: 0.75em;
		color: var(--error, #c00);
	}
</style>
