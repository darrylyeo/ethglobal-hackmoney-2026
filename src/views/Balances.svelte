<script lang="ts">
	// Types/constants
	import type { IntentDragPayload } from '$/lib/intents/types'
	import { CoinType, ercTokens } from '$/constants/coins'
	import { DataSource } from '$/constants/data-sources'
	import { MediaType } from '$/constants/media'
	import { networksByChainId } from '$/constants/networks'
	import { EntityType } from '$/data/$EntityType'

	// Context
	import { and, eq, or, useLiveQuery } from '@tanstack/svelte-db'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'

	// Props
	let {
		selectedActor,
		balanceTokens = [],
	}: {
		selectedActor: `0x${string}` | null
		balanceTokens?: {
			chainId: number
			tokenAddress: `0x${string}`
		}[]
	} = $props()

	// Functions
	import { formatSmallestToDecimal } from '$/lib/format'
	import { getStorkAssetIdForSymbol } from '$/lib/stork'

	// State
	import {
		actorCoinsCollection,
		fetchAllBalancesForAddress,
	} from '$/collections/actor-coins'
	import {
		storkPricesCollection,
		subscribeStorkPrices,
		getBestStorkPrice,
	} from '$/collections/stork-prices'
	import { tokenListCoinsCollection } from '$/collections/token-list-coins'

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
	const balanceTokenListCoins = $derived(
		displayTokens.map((token) => ({
			chainId: token.chainId,
			address: token.address,
			symbol: token.symbol,
			decimals: token.decimals,
		})),
	)
	const balancesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: actorCoinsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Voltaire))
				.where(({ row }) =>
					eq(
						row.$id.address,
						selectedActor ?? '0x0000000000000000000000000000000000000000',
					),
				)
				.where(({ row }) =>
					displayTokens.length > 0
						? displayTokens
								.map((token) =>
									and(
										eq(row.$id.chainId, token.chainId),
										eq(row.$id.tokenAddress, token.address),
									),
								)
								.reduce((acc, filter) => or(acc, filter))
						: and(eq(row.$id.chainId, -1), eq(row.$id.chainId, 0)),
				)
				.select(({ row }) => ({ row })),
		[() => selectedActor, () => displayTokens],
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
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)
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

	// Actions
	$effect(() => {
		if (selectedActor && balanceTokenListCoins.length > 0)
			fetchAllBalancesForAddress(
				selectedActor,
				undefined,
				balanceTokenListCoins,
			)
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
	import EntityId from '$/components/EntityId.svelte'
	import Tooltip from '$/components/Tooltip.svelte'
	import CoinAmount from '$/views/CoinAmount.svelte'
	import StorkPriceFeed from '$/views/StorkPriceFeed.svelte'
</script>

<div style="display: contents" {@attach liveQueryAttachment}>
{#if selectedActor}
	<section class="balances">
		<h3>Your balances</h3>
		{#if balances.length > 0}
			{#if netWorthUsd !== null}
				<p class="net-worth">
					Net worth: ${formatSmallestToDecimal(netWorthUsd, 18, 2)}
				</p>
			{/if}
		{/if}
		<div class="balances-grid" data-balances-grid>
			{#each balances as b (b.$id.chainId + ':' + b.$id.tokenAddress)}
				{@const token = displayTokens.find(
					(entry) =>
						entry.chainId === b.$id.chainId &&
						entry.address.toLowerCase() === b.$id.tokenAddress.toLowerCase(),
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
					{@const intent = {
						entity: {
							type: EntityType.ActorCoin,
							id: b.$id,
						},
						context: {
							source: 'balances',
						},
					} satisfies IntentDragPayload}
					<div class="balance-item" data-balance-item>
						<dt>{network.name}</dt>
						{#if b.isLoading}
							<span class="balance-loading" aria-busy="true">Loading…</span>
						{:else if b.error}
							<span class="balance-error" data-balance-error>{b.error}</span>
						{:else}
							<Tooltip contentProps={{ side: 'top' }}>
								{#snippet Content()}
									<StorkPriceFeed symbol={b.symbol} {priceRow} />
								{/snippet}
								<EntityId
									className="balance-intent"
									draggableText={`${b.symbol} ${b.$id.address}`}
									{intent}
								>
									<CoinAmount {coin} amount={b.balance} draggable={false} />
								</EntityId>
							</Tooltip>
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
	</section>
{/if}
</div>

<style>
	.balances {
		padding: 1em;
		background: var(--surface-1);
		border-radius: 0.5em;
	}

	.balances h3 {
		margin: 0 0 0.75em;
		font-size: 1em;
	}

	.net-worth {
		margin: 0 0 0.75em;
		font-weight: 600;
	}

	.balances-grid {
		display: grid;
		gap: 0.75em;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	}

	.balance-item {
		display: flex;
		flex-direction: column;

		dt {
			margin: 0;
			font-size: 0.75em;
			opacity: 0.7;
		}
	}

	.balance-loading {
		font-size: 0.875em;
		opacity: 0.8;
	}

	.balance-error {
		font-size: 0.75em;
		color: var(--error, #c00);
	}
</style>
