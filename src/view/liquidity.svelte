<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	// State
	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let selectedChainId = $state<number | null>(null)

	// Components
	import Wallets from '$/views/Wallets.svelte'
	import LiquidityFlow from '$/routes/session/LiquidityFlow.svelte'
</script>

<main id="main" data-column data-sticky-container>
	<section data-scroll-item>
		<details open data-card>
			<summary>
				<header data-card="secondary" data-row="wrap gap-2">
					<Wallets
						bind:connectedWallets
						bind:selectedActor
						bind:selectedChainId
					/>
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
	</section>
</main>
