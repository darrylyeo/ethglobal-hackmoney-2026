<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	// State
	import { bridgeSettingsState } from '$/state/bridge-settings.svelte'

	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let balanceTokens = $state<{ chainId: number; tokenAddress: `0x${string}` }[]>(
		[],
	)

	const globalIsTestnet = $derived(bridgeSettingsState.current.isTestnet)

	// Components
	import Balances from '$/views/Balances.svelte'
	import Session from '$/views/Session.svelte'
	import Wallets from '$/views/Wallets.svelte'
	import UnifiedBridgeFlow from '$/routes/session/UnifiedBridgeFlow.svelte'
</script>


<Session title="USDC Bridge">
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
		<UnifiedBridgeFlow
			selectedWallets={connectedWallets}
			{selectedActor}
			{globalIsTestnet}
			bind:balanceTokens
		/>
	{/snippet}
</Session>
