<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	// Props
	let {
		connectedWallets = $bindable([]),
		selectedActor = $bindable(null as `0x${string}` | null),
	}: {
		connectedWallets?: ConnectedWallet[]
		selectedActor?: `0x${string}` | null
	} = $props()

	// Components
	import Wallets from '$/views/Wallets.svelte'
</script>

<Wallets bind:connectedWallets bind:selectedActor />
