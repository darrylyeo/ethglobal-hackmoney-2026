<script lang="ts">
	// Types/constants
	import { NetworkEnvironment } from '$/constants/network-environment.ts'
	import {
		networkEnvironmentState,
		setNetworkEnvironment,
	} from '$/state/network-environment.svelte.ts'


	// State
	const networkEnvironmentItems: NetworkEnvironment[] = [
		NetworkEnvironment.Mainnet,
		NetworkEnvironment.Testnet,
	]
	let selected = $state<NetworkEnvironment>(networkEnvironmentState.current)

	// (Derived)
	$effect(() => {
		selected = networkEnvironmentState.current
	})
	$effect(() => {
		if (selected !== networkEnvironmentState.current) setNetworkEnvironment(selected)
	})


	// Components
	import Select from '$/components/Select.svelte'
</script>


<label data-row="align-center" aria-label="Network environment">
	<Select
		items={networkEnvironmentItems}
		bind:value={selected}
		getItemId={(e) => e}
		getItemLabel={(e) => (e === NetworkEnvironment.Testnet ? 'Testnet' : 'Mainnet')}
		ariaLabel="Network environment (Mainnet / Testnet)"
		data-wallet-network-testnet={selected === NetworkEnvironment.Testnet}
		data-wallet-network-mainnet={selected === NetworkEnvironment.Mainnet}
	/>
	<span data-wallet-network-label>
		{selected === NetworkEnvironment.Testnet ? 'Testnet' : 'Mainnet'}
	</span>
</label>
