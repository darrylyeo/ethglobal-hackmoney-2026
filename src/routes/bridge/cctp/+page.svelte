<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	// State
	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)

	// Components
	import Balances from '../lifi/Balances.svelte'
	import CctpBridgeFlow from './CctpBridgeFlow.svelte'
	import Wallets from '../lifi/Wallets.svelte'
</script>


<svelte:head>
	<title>USDC Bridge (CCTP)</title>
</svelte:head>


<details open data-card>
	<summary>
		<header data-card="secondary" data-row="wrap gap-2">
			<Wallets
				bind:connectedWallets
				bind:selectedActor
			/>
		</header>
	</summary>

	<div data-column="gap-6">
		<h1>USDC Bridge (CCTP)</h1>
		<Balances
			{selectedActor}
		/>
		<CctpBridgeFlow
			selectedWallets={connectedWallets}
			{selectedActor}
		/>
	</div>
</details>
