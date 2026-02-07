<script lang="ts">


	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections.ts'


	// Props
	let {
		selectedWallets,
		selectedActor,
		selectedChainId,
		params = $bindable(),
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
		selectedChainId: number | null
		params?: Record<string, unknown>,
	} = $props()


	// Components
	import LiquidityFlow from './LiquidityFlow.svelte'
</script>


<LiquidityFlow
	{selectedWallets}
	{selectedActor}
	{selectedChainId}
/>
