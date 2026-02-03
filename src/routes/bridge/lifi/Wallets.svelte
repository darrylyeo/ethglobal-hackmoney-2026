<script lang="ts">
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	import Wallets from '$/views/Wallets.svelte'

	let {
		connectedWallets = $bindable([] as ConnectedWallet[]),
		selectedActor = $bindable(null as `0x${string}` | null),
		selectedChainId = $bindable(null as number | null),
		selectionMode = 'single' as 'single' | 'multiple',
	}: {
		connectedWallets?: ConnectedWallet[]
		selectedActor?: `0x${string}` | null
		selectedChainId?: number | null
		selectionMode?: 'single' | 'multiple'
	} = $props()
</script>

<Wallets
	bind:connectedWallets
	bind:selectedActor
	bind:selectedChainId
	{selectionMode}
/>
