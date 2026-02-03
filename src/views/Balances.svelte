<script lang="ts">
	// Types/constants
	import { CoinType } from '$/constants/coins'
	import { DataSource } from '$/constants/data-sources'
	import { EntityType } from '$/data/$EntityType'
	import { MediaType } from '$/constants/media'
	import {
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks'
	import type { IntentDragPayload } from '$/lib/intents/types'

	// Context
	import { and, eq, or, useLiveQuery } from '@tanstack/svelte-db'

	// Props
	let {
		selectedActor,
	}: {
		selectedActor: `0x${string}` | null
	} = $props()

	// Functions
	import { formatSmallestToDecimal } from '$/lib/format'
	import { getStorkAssetIdForSymbol } from '$/lib/stork'

	// State
	import {
		actorCoinsCollection,
		fetchAllBalancesForAddress,
	} from '$/collections/actor-coins'
	import { tokenListCoinsCollection } from '$/collections/token-list-coins'
	import {
		storkPricesCollection,
		subscribeStorkPrices,
		getBestStorkPrice,
	} from '$/collections/stork-prices'
	import {
		bridgeSettingsState,
		defaultBridgeSettings,
	} from '$/state/bridge-settings.svelte'

	// (Derived)
	const settings = $derived(
		bridgeSettingsState.current ?? defaultBridgeSettings,
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			settings.isTestnet ?
				n.type === NetworkType.Testnet
			:
				n.type === NetworkType.Mainnet,
		),
	)
	const tokenListQuery = useLiveQuery((q) =>
		q
			.from({ row: tokenListCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.TokenLists))
			.select(({ row }) => ({ row })),
	)
	const filteredTokenListCoins = $derived(
		(tokenListQuery.data ?? [])
			.map((r) => r.row)
			.filter((token) =>
				filteredNetworks.some((network) => network.id === token.chainId),
			),
	)
	const balancesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: actorCoinsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Voltaire))
				.where(({ row }) =>
					eq(row.$id.address, selectedActor ?? ('0x' as `0x${string}`)),
				)
				.where(({ row }) =>
					filteredTokenListCoins.length > 0 ?
						or(
							...filteredTokenListCoins.map((token) =>
								and(
									eq(row.$id.chainId, token.chainId),
									eq(row.$id.tokenAddress, token.address),
								),
							),
						)
					:
						and(
							eq(row.$id.chainId, -1),
							eq(row.$id.chainId, 0),
						),
				)
				.select(({ row }) => ({ row })),
		[() => selectedActor, () => filteredTokenListCoins],
	)
	const pricesQuery = useLiveQuery((q) =>
		q
			.from({ row: storkPricesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Stork))
			.select(({ row }) => ({ row })),
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
		balances.length > 0 ?
			balances.reduce((total, balance) => {
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
		:
			null,
	)

	// Actions
	$effect(() => {
		void settings.isTestnet
		if (selectedActor && filteredTokenListCoins.length > 0)
			fetchAllBalancesForAddress(
				selectedActor,
				filteredNetworks.map((n) => n.id),
				filteredTokenListCoins,
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
				{@const token = filteredTokenListCoins.find(
					(entry) =>
						entry.chainId === b.$id.chainId &&
						entry.address.toLowerCase() === b.$id.tokenAddress.toLowerCase(),
				)}
				{@const assetId = getStorkAssetIdForSymbol(b.symbol)}
				{@const priceRow =
					assetId ? getBestStorkPrice(prices, assetId, b.$id.chainId) : null}
				{@const balanceUsdValue = (
					priceRow ?
						(b.balance * priceRow.price) / 10n ** BigInt(b.decimals)
					:
						null
				)}
				{@const coin = (
					token ?
						{
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
					:
						{
							type: CoinType.Erc20,
							chainId: b.$id.chainId,
							address: b.$id.tokenAddress,
							symbol: b.symbol,
							decimals: b.decimals,
						}
				)}
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
					<div class="balance-item">
						<dt>{network.name}</dt>
						<Tooltip contentProps={{ side: 'top' }}>
							{#snippet Content()}
								<StorkPriceFeed symbol={b.symbol} priceRow={priceRow} />
							{/snippet}
							<EntityId
								className="balance-intent"
								draggableText={`${b.symbol} ${b.$id.address}`}
								{intent}
							>
								<CoinAmount coin={coin} amount={b.balance} draggable={false} />
							</EntityId>
						</Tooltip>
						{#if balanceUsdValue !== null}
							<small data-muted>
								≈ ${formatSmallestToDecimal(balanceUsdValue, 18, 2)}
							</small>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	</section>
{/if}


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
</style>
