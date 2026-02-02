<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	// State
	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let selectedChainId = $state<number | null>(null)

	// Components
	import Balances from './Balances.svelte'
	import BridgeFlow from './BridgeFlow.svelte'
	import Wallets from './Wallets.svelte'
</script>

<svelte:head>
	<title>USDC Bridge</title>
</svelte:head>

<details open data-card>
	<summary>
		<header data-card="secondary" data-row="wrap gap-2">
			<Wallets bind:connectedWallets bind:selectedActor bind:selectedChainId />
		</header>
	</summary>

	<div data-column="gap-6">
		<h1>USDC Bridge</h1>
		<Balances {selectedActor} />
		<BridgeFlow
			selectedWallets={connectedWallets}
			{selectedActor}
			{selectedChainId}
		/>
	</div>
</details>
