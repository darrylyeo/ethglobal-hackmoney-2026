<script lang="ts">
	// Types/constants
	import { NetworkEnvironment } from '$/constants/network-environment.ts'


	// State
	import {
		networkEnvironmentState,
		setNetworkEnvironment,
	} from '$/state/network-environment.svelte.ts'


	// (Derived)
	const isTestnet = $derived(
		networkEnvironmentState.current === NetworkEnvironment.Testnet,
	)


	// Actions
	const onCheckedChange = (checked: boolean | 'indeterminate') =>
		setNetworkEnvironment(
			checked === true ? NetworkEnvironment.Testnet : NetworkEnvironment.Mainnet,
		)


	// Components
	import { Switch } from 'bits-ui'
</script>

<label data-row="gap-2 align-center" aria-label="Network environment">
	<Switch.Root
		checked={isTestnet}
		onCheckedChange={onCheckedChange}
		aria-label="Mainnets / Testnets"
		data-wallet-network-testnet={!isTestnet}
		data-wallet-network-mainnet={isTestnet}
	>
		<Switch.Thumb />
	</Switch.Root>
	<span data-wallet-network-label>
		{isTestnet ? 'Testnet' : 'Mainnet'}
	</span>
</label>
