<script lang="ts">


	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'


	// State
	import { bridgeSettingsState } from '$/state/bridge-settings.svelte'

	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let balanceTokens = $state<
		{ chainId: number; tokenAddress: `0x${string}` }[]
	>([])

	const globalIsTestnet = $derived(bridgeSettingsState.current.isTestnet)


	// Components
	import CoinBalances from '$/views/CoinBalances.svelte'
	import Session from '$/views/Session.svelte'
	import AccountsSelect from '$/views/AccountsSelect.svelte'
	import BridgeAction from '$/routes/session/BridgeAction.svelte'
</script>


<Session title="USDC Bridge">
	{#snippet Context()}
		<details open data-card>
			<summary>
				<header data-card data-row="wrap gap-2">
					<AccountsSelect bind:connectedWallets bind:selectedActor />
				</header>
			</summary>
			<div data-column="gap-3">
				<CoinBalances {selectedActor} {balanceTokens} />
			</div>
		</details>
	{/snippet}

	{#snippet Actions()}
		<BridgeAction
			selectedWallets={connectedWallets}
			{selectedActor}
			{globalIsTestnet}
			bind:balanceTokens
		/>
	{/snippet}
</Session>
