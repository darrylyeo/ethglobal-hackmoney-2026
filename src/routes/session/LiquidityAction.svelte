<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'


	// Props
	let {
		selectedWallets,
		selectedActor,
		selectedChainId,
		globalIsTestnet = false,
		params = $bindable(),
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
		selectedChainId: number | null
		globalIsTestnet?: boolean
		params?: Record<string, unknown>,
	} = $props()


	// Components
	import LiquidityFlow from './LiquidityFlow.svelte'
</script>


<LiquidityFlow
	{selectedWallets}
	{selectedActor}
	{selectedChainId}
	{globalIsTestnet}
/>
