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
	import CctpBalances from './CctpBalances.svelte'
	import CctpBridgeFlow from './CctpBridgeFlow.svelte'
	import CctpWallets from './CctpWallets.svelte'
</script>


<svelte:head>
	<title>USDC Bridge (CCTP)</title>
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
					<CctpWallets bind:connectedWallets bind:selectedActor />
				</header>
			</summary>

			<div data-column="gap-6">
				<h1>USDC Bridge (CCTP)</h1>
				<CctpBalances {selectedActor} {balanceTokens} />
				<CctpBridgeFlow
					selectedWallets={connectedWallets}
					{selectedActor}
					bind:balanceTokens
				/>
			</div>
		</details>
	</section>
</main>
