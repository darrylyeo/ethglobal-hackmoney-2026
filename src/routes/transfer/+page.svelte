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
	import Wallets from '$/views/Wallets.svelte'
	import TransferFlow from '$/routes/transfers/TransferFlow.svelte'
</script>


<svelte:head>
	<title>Transfer – USDC Tools</title>
</svelte:head>


<main
	id="main"
	data-column
	data-sticky-container
>
	<section data-scroll-item>
		<details open data-card>
			<summary>
				<header data-card="secondary" data-row="wrap gap-2">
					<Wallets bind:connectedWallets bind:selectedActor />
				</header>
			</summary>

			<div data-column="gap-6">
				<h1 data-intent-transition="route">Transfer USDC</h1>
				<TransferFlow
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
			</div>
		</details>
	</section>
</main>
