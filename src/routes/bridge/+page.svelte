<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	// State
	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let balanceTokens = $state<{ chainId: number; tokenAddress: `0x${string}` }[]>(
		[],
	)

	// Components
	import Balances from '$/views/Balances.svelte'
	import Wallets from '$/views/Wallets.svelte'
	import UnifiedBridgeFlow from './UnifiedBridgeFlow.svelte'
</script>


<svelte:head>
	<title>USDC Bridge</title>
</svelte:head>


<main
	id="main"
	data-column
	data-sticky-container
>
	<section data-scroll-item>
		<details open data-card>
			<summary>
				<header data-card="secondary" data-row="wrap gap-2">
					<Wallets bind:connectedWallets bind:selectedActor />
				</header>
			</summary>

			<div data-column="gap-6">
				<h1>USDC Bridge</h1>
				<Balances {selectedActor} {balanceTokens} />
				<UnifiedBridgeFlow
					selectedWallets={connectedWallets}
					{selectedActor}
					bind:balanceTokens
				/>
			</div>
		</details>
	</section>
</main>
