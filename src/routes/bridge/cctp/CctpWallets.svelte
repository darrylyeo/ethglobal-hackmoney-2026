<script lang="ts">


	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections.ts'


	// Props
	let {
		connectedWallets = $bindable([]),
		selectedActor = $bindable(null as `0x${string}` | null),
	}: {
		connectedWallets?: ConnectedWallet[],
		selectedActor?: `0x${string}` | null,
	} = $props()


	// Components
	import AccountsSelect from '$/views/AccountsSelect.svelte'
</script>


<AccountsSelect
	bind:connectedWallets
	bind:selectedActor
/>
