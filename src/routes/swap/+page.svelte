<script lang="ts">
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	import Balances from '$/routes/bridge/lifi/Balances.svelte'
	import Wallets from '$/routes/bridge/lifi/Wallets.svelte'
	import SwapFlow from './SwapFlow.svelte'

	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let selectedChainId = $state<number | null>(null)
</script>

<svelte:head>
	<title>Swap</title>
</svelte:head>

<details open data-card>
	<summary>
		<header data-card="secondary" data-row="wrap gap-2">
			<Wallets bind:connectedWallets bind:selectedActor bind:selectedChainId />
		</header>
	</summary>

	<div data-column="gap-6">
		<h1>Swap</h1>
		<Balances {selectedActor} />
		<SwapFlow
			selectedWallets={connectedWallets}
			{selectedActor}
			{selectedChainId}
		/>
	</div>
</details>
