<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { ercTokens } from '$/constants/coins'


	// State
	import { fetchAllBalancesForAddress } from '$/collections/actor-coins'

	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let balanceTokens = $state<
		{ chainId: number; tokenAddress: `0x${string}` }[]
	>([])

	const balanceTokensToFetch = $derived(
		(() => {
			const resolved =
				balanceTokens.length > 0
					? balanceTokens.flatMap((t) => {
							const e = ercTokens.find(
								(e) =>
									e.chainId === t.chainId &&
									e.address.toLowerCase() ===
										t.tokenAddress.toLowerCase(),
							)
							return e ? [e] : []
						})
					: ercTokens
			return resolved.length > 0 ? resolved : ercTokens
		})(),
	)
	$effect(() => {
		if (!selectedActor || balanceTokensToFetch.length === 0) return
		void fetchAllBalancesForAddress(
			selectedActor,
			undefined,
			balanceTokensToFetch,
		)
	})


	// Components
	import SwapAction from './SwapAction.svelte'
	import AccountsSelect from '$/views/AccountsSelect.svelte'
	import CoinBalances from '$/views/CoinBalances.svelte'
	import Session from '$/views/Session.svelte'
</script>


<Session title="Swap">
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
		<SwapAction
			selectedWallets={connectedWallets}
			{selectedActor}
			bind:balanceTokens
		/>
	{/snippet}
</Session>
