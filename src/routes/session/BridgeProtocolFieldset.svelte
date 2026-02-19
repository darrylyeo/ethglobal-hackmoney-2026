<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import {
		BridgeProtocolId,
		protocolToBridgeId,
	} from '$/constants/bridge-protocol-intents.ts'
	import { Protocol } from '$/constants/protocols.ts'
	import { isCctpSupportedChain } from '$/lib/cctp.ts'
	import { isGatewaySupportedChain } from '$/lib/gateway.ts'


	// Props
	let {
		action = $bindable(),
		isTestnet = false,
		actors = [],
	}: {
		action: Action
		isTestnet?: boolean
		actors?: readonly `0x${string}`[]
	} = $props()


	// (Derived)
	const p = $derived(
		action.type === ActionType.Bridge
			? (action.params as { fromChainId: number | null; toChainId: number | null; protocolIntent: BridgeProtocolId | null })
			: null,
	)
	const fromChainId = $derived(p?.fromChainId ?? null)
	const toChainId = $derived(p?.toChainId ?? null)
	const protocolIntent = $derived(p?.protocolIntent ?? null)

	const cctpPairSupported = $derived(
		fromChainId !== null &&
			toChainId !== null &&
			isCctpSupportedChain(fromChainId) &&
			isCctpSupportedChain(toChainId),
	)
	const lifiPairSupported = $derived(fromChainId !== null && toChainId !== null)
	const gatewayPairSupported = $derived(
		fromChainId !== null &&
			toChainId !== null &&
			isGatewaySupportedChain(fromChainId, isTestnet) &&
			isGatewaySupportedChain(toChainId, isTestnet),
	)

	const activeProtocol = $derived(
		(protocolIntent ??
			(action.protocolAction?.protocol != null
				? (protocolToBridgeId[action.protocolAction.protocol as Protocol] ?? null)
				: null) ??
			(cctpPairSupported ? BridgeProtocolId.Cctp : gatewayPairSupported ? BridgeProtocolId.Gateway : lifiPairSupported ? BridgeProtocolId.Lifi : null)) as BridgeProtocolId | null,
	)


	// Components
	import CctpBridgeSettingsFieldset from './CctpBridgeSettingsFieldset.svelte'
	import GatewayBridgeSettingsFieldset from './GatewayBridgeSettingsFieldset.svelte'
	import LifiBridgeSettingsFieldset from './LifiBridgeSettingsFieldset.svelte'
</script>


{#if action.type === ActionType.Bridge}
	<div data-column>
		{#if activeProtocol === BridgeProtocolId.Cctp}
			<CctpBridgeSettingsFieldset bind:action />
		{:else if activeProtocol === BridgeProtocolId.Lifi}
			<LifiBridgeSettingsFieldset bind:action />
		{:else if activeProtocol === BridgeProtocolId.Gateway}
			<GatewayBridgeSettingsFieldset bind:action actors={actors} network={fromChainId ?? undefined} />
		{:else if fromChainId !== null && toChainId !== null}
			<p data-error>This chain pair is not supported by CCTP, LI.FI, or Gateway.</p>
		{/if}
	</div>
{/if}
