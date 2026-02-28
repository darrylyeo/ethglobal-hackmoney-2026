<script lang="ts">
	// Types/constants
	import type { Actor$Id } from '$/data/Actor.ts'
	import { BalanceDisplayType } from '$/views/balance-display-type.ts'
	import type { Erc20Token } from '$/constants/coin-instances.ts'
	import { erc20TokenByNetwork, CoinInstanceType } from '$/constants/coin-instances.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { MediaType } from '$/constants/media.ts'
	import {
		networksByChainId,
	} from '$/constants/networks.ts'
	import {
		FilterDisplayType,
		FilterOperation,
		type Filter,
	} from '$/components/Filters.svelte'
	import type { Sort } from '$/components/Sorts.svelte'
	type DisplayToken = (typeof displayTokens)[number]
	type BalanceFilterId = string
	type BalanceFilterItem = {
		symbol: string
		$id: {
			$actor: {
				address: `0x${string}`
				$network: {
					chainId: number
				}
			}
		}
	}

	enum ActorCoinSort {
		SymbolAsc = 'symbol-asc',
		SymbolDesc = 'symbol-desc',
		ValueDesc = 'value-desc',
		ValueAsc = 'value-asc',
	}


	// Context
	import { and, eq, or, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let {
		actorId,
		balanceTokens = [],
		availableAccounts = [],
		displayType = BalanceDisplayType.Card,
	}: {
		actorId: Actor$Id | null
		balanceTokens?: {
			chainId: number
			tokenAddress: `0x${string}`
		}[]
		availableAccounts?: `0x${string}`[]
		displayType?: BalanceDisplayType
	} = $props()


	// Functions
	import { stringify } from 'devalue'
	import { intentDraggable } from '$/lib/intents/intentDraggable.svelte.ts'
	import { formatSmallestToDecimal } from '$/lib/format.ts'
	import { getStorkAssetIdForSymbol } from '$/lib/stork.ts'


	// State
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { ActorCoin } from '$/data/ActorCoin.ts'
	import { actorCoinsCollection } from '$/collections/ActorCoins.ts'
	import { fetchAllBalancesForAddress } from '$/collections/ActorCoins.ts'
	import {
		storkPricesCollection,
		subscribeStorkPrices,
		getBestStorkPrice,
	} from '$/collections/StorkPrices.ts'
	import { tokenListCoinsCollection } from '$/collections/TokenListCoins.ts'
	let activeFilters = $state(
		new Set<Filter<BalanceFilterItem, BalanceFilterId>>()
	)
	let sortedBalances = $state<WithSource<ActorCoin>[]>([])

	// (Derived)
	const normalizedBalanceTokens = $derived([
		...new Map(
			balanceTokens.map((token) => [
				`${token.chainId}:${token.tokenAddress}`,
				token,
			]),
		).values(),
	])
	const tokenListQuery = useLiveQuery(
		(q) =>
			q
				.from({ token: tokenListCoinsCollection })
				.where(({ token }) =>
					normalizedBalanceTokens.length > 0
						? normalizedBalanceTokens
								.map((t) =>
									and(
										eq(token.$id.$network.chainId, t.chainId),
										eq(token.$id.address, t.tokenAddress),
									),
								)
								.reduce((acc, filter) => or(acc, filter))
						: and(
								eq(token.$id.$network.chainId, -1),
								eq(token.$id.$network.chainId, 0),
							),
				)
				.select(({ token }) => ({ token })),
		[() => normalizedBalanceTokens],
	)
	const filteredTokenListCoins = $derived(
		(tokenListQuery.data ?? []).map(({ token }) => token)
	)
	const fallbackTokens = $derived(
		balanceTokens
			.map((token) =>
				erc20TokenByNetwork
					.get(token.chainId)
					?.find((t) => t.$id.address === token.tokenAddress),
			)
			.flatMap((t) => (t ? [t] : []))
	)
	const tokensToFetch = $derived(
		normalizedBalanceTokens
			.map((token) =>
				erc20TokenByNetwork
					.get(token.chainId)
					?.find((t) => t.$id.address === token.tokenAddress),
			)
			.filter((t): t is Erc20Token => t != null)
	)
	const displayTokens = $derived(
		(filteredTokenListCoins.length > 0
			? filteredTokenListCoins
			: fallbackTokens
		).map((token) => {
			const chainId = token.$id.$network.chainId
			const address = token.$id.address
			return {
				...token,
				chainId,
				address,
				name: 'name' in token ? token.name : token.symbol,
				logoURI: 'logoURI' in token ? token.logoURI : undefined,
			}
		})
	)
	const skeletonTokens = $derived(
		displayTokens.length > 0 ? displayTokens.slice(0, 6) : []
	)
	const skeletonRows: (DisplayToken | null)[] = $derived(
		skeletonTokens.length > 0
			? skeletonTokens
			: Array.from({ length: 6 }, () => null)
	)
	const balanceTokenListCoins = $derived(
		displayTokens.map((token) => ({
			chainId: token.chainId,
			address: token.address,
			symbol: token.symbol,
			decimals: token.decimals,
		}))
	)
	const networkFilterOptions = $derived(
		[...new Set(balanceTokenListCoins.map((t) => t.chainId))].map((chainId) => ({
			chainId,
			name: networksByChainId[chainId]?.name ?? `Chain ${chainId}`,
		}))
	)
	const symbolFilterOptions = $derived(
		[...new Set(balanceTokenListCoins.map((t) => t.symbol))].sort()
	)
	const networkFilters = $derived(
		networkFilterOptions.map(({ chainId, name }) => ({
			id: String(chainId),
			label: name,
			filterFunction: (balance: BalanceFilterItem) => (
				balance.$id.$actor.$network.chainId === chainId
			),
		}))
	)
	const coinFilters = $derived(
		symbolFilterOptions.map((symbol) => ({
			id: symbol,
			label: symbol,
			filterFunction: (balance: BalanceFilterItem) => balance.symbol === symbol,
		}))
	)
	const accountsForFilters = $derived(
		availableAccounts.length > 0 ? availableAccounts : (actorId ? [actorId.address] : [])
	)
	const accountFilters = $derived(
		accountsForFilters.map((address) => ({
			id: address,
			label: `${address.slice(0, 6)}…${address.slice(-4)}`,
			filterFunction: (balance: BalanceFilterItem) => (
				balance.$id.$actor.address === address
			),
		}))
	)
	const networkFilterIds = $derived(
		new Set(networkFilters.map((f) => f.id))
	)
	const coinFilterIds = $derived(
		new Set(coinFilters.map((f) => f.id))
	)
	const accountFilterIds = $derived(
		new Set(accountFilters.map((f) => f.id))
	)
	const filterChainIdsNum = $derived(
		[...activeFilters]
			.filter((f) => networkFilterIds.has(f.id))
			.map((f) => Number(f.id))
			.filter((n) => !Number.isNaN(n))
	)
	const filterSymbols = $derived(
		[...activeFilters].filter((f) => coinFilterIds.has(f.id)).map((f) => f.id)
	)
	const filterAddresses = $derived(
		[...activeFilters]
			.filter((f) => accountFilterIds.has(f.id))
			.map((f) => f.id as `0x${string}`)
	)
	const actors = $derived(
		filterAddresses.length > 0
			? filterAddresses
			: actorId
				? [actorId.address]
				: []
	)
	const balancesQuery = useLiveQuery(
		(q) =>
			q
				.from({ balance: actorCoinsCollection })
				.where(({ balance }) => {
					const addrCondition = (
						actors.length === 0
							? and(
									eq(balance.$id.$actor.address, '0x0000000000000000000000000000000000000000'),
									eq(balance.$id.$actor.address, '0x0000000000000000000000000000000000000001'),
								)
							: actors.length === 1
								? eq(balance.$id.$actor.address, actors[0])
								: actors
										.map((a) => eq(balance.$id.$actor.address, a))
										.reduce((acc, cond) => or(acc, cond))
					)
					const tokenCondition = (
						displayTokens.length > 0
							? displayTokens
									.map((token) =>
										and(
											eq(balance.$id.$coin.$network.chainId, token.chainId),
											eq(balance.$id.$coin.address, token.address),
										),
									)
									.reduce((acc, filter) => or(acc, filter))
							: and(
									eq(balance.$id.$actor.$network.chainId, -1),
									eq(balance.$id.$actor.$network.chainId, 0),
								)
					)
					const chainCondition = (
						filterChainIdsNum.length > 0
							? filterChainIdsNum
									.map((c) => eq(balance.$id.$actor.$network.chainId, c))
									.reduce((acc, cond) => or(acc, cond))
							: null
					)
					const symbolCondition = (
						filterSymbols.length > 0
							? filterSymbols
									.map((s) => eq(balance.symbol, s))
									.reduce((acc, cond) => or(acc, cond))
							: null
					)
					return and(
						addrCondition,
						tokenCondition,
						...(chainCondition ? [chainCondition] : []),
						...(symbolCondition ? [symbolCondition] : []),
					)
				})
				.select(({ balance }) => ({ balance })),
		[() => actors, () => displayTokens, () => filterChainIdsNum, () => filterSymbols],
	)
	const pricesQuery = useLiveQuery((q) =>
		q.from({ price: storkPricesCollection }).select(({ price }) => ({ price })),
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
	const balances = $derived(
		(balancesQuery.data ?? []).map(({ balance }) => balance)
	)
	const prices = $derived(
		(pricesQuery.data ?? []).map(({ price }) => price)
	)
	const balanceAssetIds = $derived([
		...new Set(
			balances.flatMap((balance) => {
				const assetId = getStorkAssetIdForSymbol(balance.symbol)
				return assetId ? [assetId] : []
			}),
		),
	])
	const balanceChainIds = $derived([
		...new Set(balances.map((balance) => balance.$id.$actor.$network.chainId)),
	])
	const netWorthUsd = $derived(
		balances.length > 0
			? balances.reduce((total, balance) => {
					const assetId = getStorkAssetIdForSymbol(balance.symbol)
					if (!assetId) return total
					const priceRow = getBestStorkPrice(
						prices,
						assetId,
						balance.$id.$actor.$network.chainId,
					)
					if (!priceRow) return total
					return (
						total +
						(balance.balance * priceRow.price) / 10n ** BigInt(balance.decimals)
					)
				}, 0n)
			: null
	)
	const singleNetwork = $derived(
		filterChainIdsNum.length === 1 ? filterChainIdsNum[0] : null
	)
	const singleSymbol = $derived(
		filterSymbols.length === 1 ? filterSymbols[0] : null
	)
	const singleAddress = $derived(
		filterAddresses.length === 1 ? filterAddresses[0] : null
	)
	const hasAnyFilter = $derived(
		filterChainIdsNum.length > 0 ||
			filterSymbols.length > 0 ||
			filterAddresses.length > 0
	)
	const useDynamicTitle = $derived(
		hasAnyFilter &&
			filterChainIdsNum.length <= 1 &&
			filterSymbols.length <= 1 &&
			filterAddresses.length <= 1
	)
	const balanceSortOptions = $derived(
		[
			{
				id: ActorCoinSort.SymbolAsc,
				label: 'Symbol A–Z',
				compare: (a: WithSource<ActorCoin>, b: WithSource<ActorCoin>) =>
					a.symbol.localeCompare(b.symbol),
			},
			{
				id: ActorCoinSort.SymbolDesc,
				label: 'Symbol Z–A',
				compare: (a: WithSource<ActorCoin>, b: WithSource<ActorCoin>) =>
					b.symbol.localeCompare(a.symbol),
			},
			{
				id: ActorCoinSort.ValueDesc,
				label: 'Value (high first)',
				compare: (a: WithSource<ActorCoin>, b: WithSource<ActorCoin>) => {
					const valueUsd = (x: WithSource<ActorCoin>) => {
						const aid = getStorkAssetIdForSymbol(x.symbol)
						if (!aid) return 0n
						const pr = getBestStorkPrice(
							prices,
							aid,
							x.$id.$actor.$network.chainId,
						)
						return pr ?
								(x.balance * pr.price) / 10n ** BigInt(x.decimals)
							:	0n
					}
					const va = valueUsd(a)
					const vb = valueUsd(b)
					return vb > va ? 1 : vb < va ? -1 : 0
				},
			},
			{
				id: ActorCoinSort.ValueAsc,
				label: 'Value (low first)',
				compare: (a: WithSource<ActorCoin>, b: WithSource<ActorCoin>) => {
					const valueUsd = (x: WithSource<ActorCoin>) => {
						const aid = getStorkAssetIdForSymbol(x.symbol)
						if (!aid) return 0n
						const pr = getBestStorkPrice(
							prices,
							aid,
							x.$id.$actor.$network.chainId,
						)
						return pr ?
								(x.balance * pr.price) / 10n ** BigInt(x.decimals)
							:	0n
					}
					const va = valueUsd(a)
					const vb = valueUsd(b)
					return va > vb ? 1 : va < vb ? -1 : 0
				},
			},
		] as Sort<WithSource<ActorCoin>, ActorCoinSort>[]
	)
	const hasSortOptions = $derived(
		balanceSortOptions.length > 1
	)
	const displayBalances = $derived(
		hasSortOptions ? sortedBalances : balances
	)
	const balancesTitlePrefix = $derived(
		useDynamicTitle
			? (() => {
					const symbolPart = (
						singleSymbol !== null ? `${singleSymbol} Balances` : 'Balances'
					)
					const networkPart = (
						singleNetwork !== null
							? ` on ${networksByChainId[singleNetwork]?.name ?? `Chain ${singleNetwork}`}`
							: ''
					)
					const accountPart = singleAddress !== null ? ' for ' : ''
					return symbolPart + networkPart + accountPart
				})()
			: 'Balances'
	)


	// Actions
	$effect(() => {
		if (actors.length === 0 || tokensToFetch.length === 0) return
		for (const actor of actors) {
			void fetchAllBalancesForAddress(actor, undefined, tokensToFetch)
		}
	})
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
	import Collapsible from '$/components/Collapsible.svelte'
	import Boundary from '$/components/Boundary.svelte'
	import Filters from '$/components/Filters.svelte'
	import Sorts from '$/components/Sorts.svelte'
	import Skeleton from '$/components/Skeleton.svelte'
	import TruncatedValue, {
		TruncatedValueFormat,
	} from '$/components/TruncatedValue.svelte'
	import CoinAmount from '$/views/CoinAmount.svelte'
	import CoinName from '$/views/CoinName.svelte'
	import CoinsInput from '$/views/CoinsInput.svelte'
	import NetworksInput from '$/views/NetworksInput.svelte'
</script>


{#if actors.length > 0}
		{#snippet BalancesSummary({ title }: { title: string })}
			<div class="balances-summary">
				<div data-row="gap-4">
					<div data-row="gap-4">
						<h3
							data-row-item="flexible"
							class="section-heading"
						>
							{title}{#if singleAddress}<TruncatedValue
								value={singleAddress}
								startLength={6}
								endLength={4}
								format={TruncatedValueFormat.Abbr}
							/>{/if}
						</h3>

						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->

						<div
							class="balances-filters"
							role="group"
							aria-label="Filters"
							data-row="wrap"
							onclick={(e) => e.stopPropagation()}
							onkeydown={(e) => e.stopPropagation()}
						>
							<!-- TODO: Ambiguity: facet counts are computed from currently queried balances; if we need global counts, use a separate unfiltered facet query source. -->
							{#snippet NetworkFilters({
								bindValueIds,
							}: {
								bindValueIds: [() => BalanceFilterId[], (values: BalanceFilterId[]) => void]
							})}
								<NetworksInput
									bind:value={
										() => bindValueIds[0](),
										(values) => bindValueIds[1](values)
									}
									placeholder="Network"
									ariaLabel="Filter by network"
								/>
							{/snippet}

							{#snippet CoinFilters({
								bindValueIds,
							}: {
								bindValueIds: [() => BalanceFilterId[], (values: BalanceFilterId[]) => void]
							})}
								<CoinsInput
									bind:value={
										() => bindValueIds[0](),
										(values) => bindValueIds[1](values)
									}
									items={symbolFilterOptions}
									placeholder="Coin"
									ariaLabel="Filter by coin"
								/>
							{/snippet}

							<Filters
								items={balances}
								filterGroups={[
									{
										id: 'network',
										label: 'Network',
										displayType: FilterDisplayType.Snippet,
										operation: FilterOperation.Union,
										exclusive: false,
										filters: networkFilters,
										Snippet: NetworkFilters,
									},
									{
										id: 'coin',
										label: 'Coin',
										displayType: FilterDisplayType.Snippet,
										operation: FilterOperation.Union,
										exclusive: false,
										filters: coinFilters,
										Snippet: CoinFilters,
									},
									{
										id: 'account',
										label: 'Account',
										displayType: FilterDisplayType.Combobox,
										operation: FilterOperation.Union,
										exclusive: false,
										filters: accountFilters,
									},
								]}
								bind:activeFilters={activeFilters}
								onreset={(e) => {
									e.preventDefault()
									activeFilters = new Set()
								}}
							/>
							{#if hasSortOptions}
								<Sorts
									items={balances}
									sortOptions={balanceSortOptions}
									defaultSortId={ActorCoinSort.ValueDesc}
									bind:sortedItems={sortedBalances}
								/>
							{/if}
						</div>
					</div>

					{#if balances.length > 0 && prices.length > 0 && netWorthUsd !== null}
						<span class="net-worth">
							Total value ≈ ${formatSmallestToDecimal(netWorthUsd, 18, 2)}
						</span>
					{/if}
				</div>
			</div>
		{/snippet}

		<Collapsible
			title={balancesTitlePrefix}
			Summary={BalancesSummary}
			detailsProps={{
				class: 'balances',
				'data-card': '',
				'data-scroll-container': 'block',
				open: true,
			}}
		>
			<Boundary>
				{#if balancesQuery.isLoading && balances.length === 0}
					<div
						data-balances
						data-grid="columns-autofit column-min-8 gap-3"
						data-balances-skeleton
					>
						{#each skeletonRows as token, i (i)}
							{@const coin = token
								? {
										type: CoinInstanceType.Erc20Token,
										$id: { $network: { chainId: token.chainId }, address: token.address as `0x${string}` },
										chainId: token.chainId,
										address: token.address as `0x${string}`,
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
								<Skeleton
									width="4em"
									height="0.75em"
									rounded="0.2em"
								/>
								<div data-row="start">
									{#if coin}
										<CoinName
											coin={coin}
											isDraggable={false}
										/>
									{:else}
										<Skeleton
											width="2.5em"
											height="1.25em"
											rounded="0.25em"
										/>
									{/if}

									<Skeleton
										width="5em"
										height="1.25em"
										rounded="0.25em"
									/>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div
						data-balances
						data-grid="columns-autofit column-min-10 gap-3"
					>
						{#each displayBalances as b (stringify(b.$id))}
							{@const token = displayTokens.find(
								(entry) =>
									entry.chainId === b.$id.$coin.$network.chainId &&
									entry.address === b.$id.$coin.address,
							)}

							{@const assetId = getStorkAssetIdForSymbol(b.symbol)}

							{@const priceRow = assetId
								? getBestStorkPrice(prices, assetId, b.$id.$actor.$network.chainId)
								: null}
							{@const balanceUsdValue = priceRow
								? (b.balance * priceRow.price) / 10n ** BigInt(b.decimals)
								: null}
							{@const coin = token
								? {
										type: CoinInstanceType.Erc20Token,
										$id: { $network: { chainId: token.chainId }, address: token.address as `0x${string}` },
										chainId: token.chainId,
										address: token.address as `0x${string}`,
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
										type: CoinInstanceType.Erc20Token,
										$id: { $network: b.$id.$coin.$network, address: b.$id.$coin.address },
										chainId: b.$id.$coin.$network.chainId,
										address: b.$id.$coin.address,
										symbol: b.symbol,
										decimals: b.decimals,
									}}
							{@const network = networksByChainId[b.$id.$actor.$network.chainId]}

							{#if network}
								<div
									class="balance-item"
									data-balance-item
									data-card
									data-column
									data-display-type={displayType}
									role="term"
									{@attach intentDraggable({
										type: EntityType.ActorCoin,
										id: b.$id,
										text: `${b.symbol} ${b.$id.$coin.address}`,
										source: 'balances',
									})}
								>
									<dt data-row="start gap-1">
										{network.name}
										{#if actors.length > 1}
											<span
												data-text="muted"
												class="balance-address"
											>
												{b.$id.$actor.address.slice(0, 6)}…{b.$id.$actor.address.slice(-4)}
											</span>
										{/if}
									</dt>

									{#if b.isLoading}
										<span
											class="balance-loading"
											data-row="start"
											aria-busy="true"
										>
											<Skeleton
												width="6em"
												height="1.25em"
												rounded="0.25em"
											/>
										</span>
									{:else if b.error}
										<span
									class="balance-error"
									data-balance-error
								>{b.error}</span>
									{:else}
										<CoinAmount
											coin={coin}
											amount={b.balance}
											isDraggable={false}
											{priceRow}
										/>
										{#if balanceUsdValue !== null}
											<small data-text="muted">
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
					<div
						data-balances
						data-grid="columns-autofit column-min-8 gap-3"
						data-balances-skeleton
					>
						{#each skeletonRows as token, i (i)}
							{@const coin = token
								? {
										type: CoinInstanceType.Erc20Token,
										$id: { $network: { chainId: token.chainId }, address: token.address as `0x${string}` },
										chainId: token.chainId,
										address: token.address as `0x${string}`,
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
								<Skeleton
									width="4em"
									height="0.75em"
									rounded="0.2em"
								/>
								<div data-row="start">
									{#if coin}
										<CoinName
											coin={coin}
											isDraggable={false}
										/>
									{:else}
										<Skeleton
											width="2.5em"
											height="1.25em"
											rounded="0.25em"
										/>
									{/if}

									<Skeleton
										width="5em"
										height="1.25em"
										rounded="0.25em"
									/>
								</div>
							</div>
						{/each}
					</div>
				{/snippet}
			</Boundary>
		</Collapsible>
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
