<script lang="ts">
	// Components
	import WalletsProvider from './WalletsProvider.svelte'
	import BridgeFlow from './BridgeFlow.svelte'
</script>


<svelte:head>
	<title>USDC Bridge</title>
</svelte:head>


<WalletsProvider>
	{#snippet children({ connectedWallets, selectedActor, selectedChainId })}
		<div data-column="gap-6">
			<h1>USDC Bridge</h1>
			<BridgeFlow selectedWallets={connectedWallets} {selectedActor} {selectedChainId} />
		</div>
	{/snippet}
</WalletsProvider>
