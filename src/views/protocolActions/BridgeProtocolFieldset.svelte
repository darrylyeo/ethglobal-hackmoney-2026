<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import { Protocol, protocolToBridgeId } from '$/constants/protocols.ts'
	import type { BridgeProtocolId } from '$/constants/protocols.ts'
	import { isCctpSupportedChain } from '$/constants/cctp.ts'
	import { isGatewaySupportedChain } from '$/constants/gateway.ts'


	// Props
	let {
		action = $bindable(),
		isTestnet = false,
	}: {
		action: Action
		isTestnet?: boolean
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
			(cctpPairSupported ? ('cctp' as const) : gatewayPairSupported ? ('gateway' as const) : lifiPairSupported ? ('lifi' as const) : null)) as BridgeProtocolId | null,
	)


	// Components
	import CctpBridgeSettingsFieldset from './CctpBridgeSettingsFieldset.svelte'
	import GatewayBridgeSettingsFieldset from './GatewayBridgeSettingsFieldset.svelte'
	import LifiBridgeSettingsFieldset from './LifiBridgeSettingsFieldset.svelte'
</script>

{#if action.type === ActionType.Bridge}
	<div data-column>
		{#if activeProtocol === 'cctp'}
			<CctpBridgeSettingsFieldset bind:action />
		{:else if activeProtocol === 'lifi'}
			<LifiBridgeSettingsFieldset bind:action />
		{:else if activeProtocol === 'gateway'}
			<GatewayBridgeSettingsFieldset bind:action />
		{:else if fromChainId !== null && toChainId !== null}
			<p data-error>This chain pair is not supported by CCTP, LI.FI, or Gateway.</p>
		{/if}
	</div>
{/if}
