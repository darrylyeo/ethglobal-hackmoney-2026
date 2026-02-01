<script lang="ts">
	// Types/constants
	import type { WalletState } from '$/lib/wallet'
	import { NetworkType, networks, networksByChainId } from '$/constants/networks'

	// Context
	import { useLiveQuery } from '@tanstack/svelte-db'

	// State
	import { bridgeSettingsState, defaultBridgeSettings } from '$/state/bridge-settings.svelte'

	// Collections
	import { actorCoinsCollection, fetchAllBalancesForAddress } from '$/collections/actor-coins'

	// Functions
	import { formatSmallestToDecimal } from '$/lib/format'

	// Props
	let { wallet }: { wallet: WalletState } = $props()

	// Settings
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
	const balances = $derived(
		wallet.address
			? (balancesQuery.data ?? [])
				.map((r) => r.row)
				.filter((b) => b.$id.address.toLowerCase() === wallet.address!.toLowerCase())
			: []
	)

	// Fetch balances on wallet/network change
	$effect(() => {
		void settings.isTestnet
		if (wallet.address) fetchAllBalancesForAddress(wallet.address, filteredNetworks.map((n) => n.id))
	})
</script>


{#if wallet.address && balances.length > 0}
	<section data-balances>
		<h3>Your USDC Balances</h3>
		<div data-balances-grid>
			{#each balances as b (b.$id.chainId + ':' + b.$id.tokenAddress)}
				{@const network = networksByChainId[b.$id.chainId]}
				{#if network}
					<div data-balance-item>
						<dt>{network.name}</dt>
						<dd data-tabular>{formatSmallestToDecimal(b.balance, b.decimals, 4)} {b.symbol}</dd>
					</div>
				{/if}
			{/each}
		</div>
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

	[data-balances-grid] {
		display: grid;
		gap: 0.75em;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	}

	[data-balance-item] {
		display: flex;
		flex-direction: column;
	}

	[data-balance-item] dt,
	[data-balance-item] dd {
		margin: 0;
	}

	[data-balance-item] dt {
		font-size: 0.75em;
		opacity: 0.7;
	}
</style>
