<script lang="ts">
	// Types/constants
	import { ENTITY_TYPE } from '$/constants/entity-types'
	import { NetworkType, networks, networksByChainId } from '$/constants/networks'
	import type { IntentDragPayload } from '$/lib/intents/types'

	// Context
	import { useLiveQuery } from '@tanstack/svelte-db'

	// Props
	let {
		selectedActor,
	}: {
		selectedActor: `0x${string}` | null,
	} = $props()

	// Functions
	import { formatSmallestToDecimal } from '$/lib/format'
	import { getStorkAssetIdForSymbol } from '$/lib/stork'

	// State
	import { actorCoinsCollection, fetchAllBalancesForAddress } from '$/collections/actor-coins'
	import { storkPricesCollection, subscribeStorkPrices, getBestStorkPrice } from '$/collections/stork-prices'
	import { bridgeSettingsState, defaultBridgeSettings } from '$/state/bridge-settings.svelte'

	// (Derived)
	const settings = $derived(bridgeSettingsState.current ?? defaultBridgeSettings)

	// Networks
	const filteredNetworks = $derived(
		networks.filter((n) => (
			settings.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet
		))
	)

	// Balances query
	const balancesQuery = useLiveQuery((q) => q.from({ row: actorCoinsCollection }).select(({ row }) => ({ row })))
	const pricesQuery = useLiveQuery((q) => q.from({ row: storkPricesCollection }).select(({ row }) => ({ row })))
	const balances = $derived(
		selectedActor
			? (balancesQuery.data ?? [])
				.map((r) => r.row)
				.filter((b) => (
					b.$id.address.toLowerCase() === selectedActor!.toLowerCase() &&
					filteredNetworks.some((n) => n.id === b.$id.chainId)
				))
			: []
	)
	const prices = $derived((pricesQuery.data ?? []).map((r) => r.row))
	const balanceAssetIds = $derived(
		[...new Set(
			balances.flatMap((balance) => {
				const assetId = getStorkAssetIdForSymbol(balance.symbol)
				return assetId ? [assetId] : []
			})
		)]
	)
	const balanceChainIds = $derived(
		[...new Set(balances.map((balance) => balance.$id.chainId))]
	)
	const netWorthUsd = $derived(
		balances.length > 0
			? balances.reduce((total, balance) => {
				const assetId = getStorkAssetIdForSymbol(balance.symbol)
				if (!assetId) return total
				const priceRow = getBestStorkPrice(prices, assetId, balance.$id.chainId)
				if (!priceRow) return total
				return total + (balance.balance * priceRow.price) / (10n ** BigInt(balance.decimals))
			}, 0n)
			: null
	)

	// Fetch balances on actor/network change
	$effect(() => {
		void settings.isTestnet
		if (selectedActor) fetchAllBalancesForAddress(selectedActor, filteredNetworks.map((n) => n.id))
	})

	$effect(() => {
		const assetIds = balanceAssetIds
		if (assetIds.length === 0) return
		const unsubscribers = [
			subscribeStorkPrices({ assetIds, transports: ['rest', 'websocket'] }),
			...balanceChainIds.map((chainId) => (
				subscribeStorkPrices({ assetIds, chainId, transports: ['rpc'] })
			)),
		]
		return () => {
			for (const unsubscribe of unsubscribers) unsubscribe()
		}
	})


	// Components
	import EntityId from '$/components/EntityId.svelte'
	import StorkPrices from '$/views/StorkPrices.svelte'
</script>


{#if selectedActor && balances.length > 0}
	<section data-balances>
		<h3>Your USDC Balances</h3>
		{#if netWorthUsd !== null}
			<p data-net-worth>
				Net worth: ${formatSmallestToDecimal(netWorthUsd, 18, 2)}
			</p>
		{/if}
		<div data-balances-grid>
			{#each balances as b (b.$id.chainId + ':' + b.$id.tokenAddress)}
				{@const network = networksByChainId[b.$id.chainId]}
				{#if network}
					{@const intent = ({
						entity: {
							type: ENTITY_TYPE.actorCoin,
							id: b.$id,
						},
						context: {
							source: 'balances',
						},
					} satisfies IntentDragPayload)}
					<div data-balance-item>
						<dt>{network.name}</dt>
						<EntityId
							className="balance-intent"
							draggableText={`${b.symbol} ${b.$id.address}`}
							intent={intent}
						>
							<span data-tabular>{formatSmallestToDecimal(b.balance, b.decimals, 4)} {b.symbol}</span>
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
	[data-balances] {
		padding: 1em;
		background: var(--surface-1);
		border-radius: 0.5em;
	}

	[data-balances] h3 {
		margin: 0 0 0.75em;
		font-size: 1em;
	}

	[data-net-worth] {
		margin: 0 0 0.75em;
		font-weight: 600;
	}

	[data-balances-grid] {
		display: grid;
		gap: 0.75em;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	}

	[data-balance-item] {
		display: flex;
		flex-direction: column;
	}

	[data-balance-item] dt {
		margin: 0;
	}

	[data-balance-item] dt {
		font-size: 0.75em;
		opacity: 0.7;
	}
</style>
