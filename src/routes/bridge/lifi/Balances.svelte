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
	import { useLiveQuery, eq } from '@tanstack/svelte-db'

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
	const balancesQuery = useLiveQuery((q) =>
		q
			.from({ row: actorCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Voltaire))
			.select(({ row }) => ({ row })),
	)
	const tokenListQuery = useLiveQuery((q) =>
		q
			.from({ row: tokenListCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.TokenLists))
			.select(({ row }) => ({ row })),
	)
	const pricesQuery = useLiveQuery((q) =>
		q
			.from({ row: storkPricesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Stork))
			.select(({ row }) => ({ row })),
	)
	const filteredTokenListCoins = $derived(
		(tokenListQuery.data ?? [])
			.map((r) => r.row)
			.filter((token) =>
				filteredNetworks.some((network) => network.id === token.chainId),
			),
	)
	const balances = $derived(
		selectedActor ?
			(balancesQuery.data ?? [])
				.map((r) => r.row)
				.filter(
					(b) =>
						b.$id.address.toLowerCase() === selectedActor.toLowerCase() &&
						filteredTokenListCoins.some(
							(token) =>
								token.chainId === b.$id.chainId &&
								token.address.toLowerCase() ===
									b.$id.tokenAddress.toLowerCase(),
						),
				)
		:
			[],
	)
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
	import CoinAmount from '$/components/CoinAmount.svelte'
	import EntityId from '$/components/EntityId.svelte'
	import StorkPrices from '$/views/StorkPrices.svelte'
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
						<EntityId
							className="balance-intent"
							draggableText={`${b.symbol} ${b.$id.address}`}
							{intent}
						>
							<CoinAmount coin={coin} amount={b.balance} draggable={false} />
						</EntityId>
					</div>
				{/if}
			{/each}
		</div>
		<StorkPrices
			assetIds={balanceAssetIds}
			chainId={balanceChainIds[0] ?? null}
			title="Stork USD feeds"
		/>
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
