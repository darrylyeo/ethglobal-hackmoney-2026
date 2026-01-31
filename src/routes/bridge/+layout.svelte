<script lang="ts">
	// Props
	let { children } = $props()

	// Context – ensure wallet + bridge state exist before page content
	import { useWalletState } from '$/state/wallet.svelte'
	import {
		useBridgeAutoRefresh,
		useBridgeIsTestnet,
		useBridgeSlippage,
	} from '$/state/bridge'

	useWalletState()
	useBridgeSlippage()
	useBridgeAutoRefresh()
	useBridgeIsTestnet()
</script>

{@render children()}
