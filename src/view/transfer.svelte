<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { ercTokens } from '$/constants/coins'

	const PLACEHOLDER_ADDRESS: `0x${string}` =
		'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

	// State
	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)

	// (Derived)
	const selectedWallet = $derived(
		connectedWallets.find((wallet) => wallet.connection.selected) ?? null,
	)
	const defaultToken = $derived(ercTokens[0])
	const fromActor = $derived(selectedActor ?? PLACEHOLDER_ADDRESS)
	const toActor = $derived(selectedActor ?? PLACEHOLDER_ADDRESS)

	// Components
	import Session from '$/views/Session.svelte'
	import Wallets from '$/views/Wallets.svelte'
	import TransferAction from '$/routes/session/TransferAction.svelte'
</script>

<Session title="Transfer">
	{#snippet Context()}
		<details open data-card>
			<summary>
				<header data-card="secondary" data-row="wrap gap-2">
					<Wallets bind:connectedWallets bind:selectedActor />
				</header>
			</summary>
		</details>
	{/snippet}

	{#snippet Actions()}
		<TransferAction
			walletConnection={selectedWallet}
			{fromActor}
			{toActor}
			chainId={defaultToken.chainId}
			amount={0n}
			tokenSymbol={defaultToken.symbol}
			tokenDecimals={defaultToken.decimals}
			tokenAddress={defaultToken.address}
			mode="direct"
		/>
	{/snippet}
</Session>
