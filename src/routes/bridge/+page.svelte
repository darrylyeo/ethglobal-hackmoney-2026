<script lang="ts">
	// Components
	import WalletProvider from './WalletProvider.svelte'
	import Balances from './Balances.svelte'
	import BridgeFlow from './BridgeFlow.svelte'
</script>


<svelte:head>
	<title>USDC Bridge</title>
</svelte:head>


<WalletProvider>
	{#snippet children(wallet)}
		<div data-column="gap-6">
			<h1>USDC Bridge</h1>
			<Balances {wallet} />
			<BridgeFlow {wallet} />
		</div>
	{/snippet}
</WalletProvider>
