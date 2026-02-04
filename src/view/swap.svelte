<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	// State
	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let balanceTokens = $state<
		{ chainId: number; tokenAddress: `0x${string}` }[]
	>([])

	// Components
	import Balances from '$/views/Balances.svelte'
	import Session from '$/views/Session.svelte'
	import Wallets from '$/views/Wallets.svelte'
	import SwapAction from '$/routes/session/SwapAction.svelte'
</script>

<Session title="Swap">
	{#snippet Context()}
		<details open data-card>
			<summary>
				<header data-card="secondary" data-row="wrap gap-2">
					<Wallets bind:connectedWallets bind:selectedActor />
				</header>
			</summary>
			<div data-column="gap-3">
				<Balances {selectedActor} {balanceTokens} />
			</div>
		</details>
	{/snippet}

	{#snippet Actions()}
		<SwapAction
			selectedWallets={connectedWallets}
			{selectedActor}
			bind:balanceTokens
		/>
	{/snippet}
</Session>
