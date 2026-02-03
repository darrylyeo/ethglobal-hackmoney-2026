<script lang="ts">
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	import Wallets from '$/views/Wallets.svelte'
	import LiquidityFlow from './LiquidityFlow.svelte'

	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let selectedChainId = $state<number | null>(null)
</script>

<svelte:head>
	<title>Liquidity</title>
</svelte:head>

<details open data-card>
	<summary>
		<header data-card="secondary" data-row="wrap gap-2">
			<Wallets bind:connectedWallets bind:selectedActor bind:selectedChainId />
		</header>
	</summary>

	<div data-column="gap-6">
		<h1>Liquidity</h1>
		<LiquidityFlow
			selectedWallets={connectedWallets}
			{selectedActor}
			{selectedChainId}
		/>
	</div>
</details>
