<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import { Protocol, protocolsById } from '$/constants/protocols.ts'
	import { isCctpSupportedChain } from '$/constants/cctp.ts'
	import { isGatewaySupportedChain } from '$/constants/gateway.ts'

	type BridgeProtocolId = 'cctp' | 'lifi' | 'gateway'

	const bridgeIdToProtocol: Record<BridgeProtocolId, Protocol> = {
		cctp: Protocol.Cctp,
		lifi: Protocol.LiFi,
		gateway: Protocol.CircleGateway,
	}


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
		!cctpPairSupported && !lifiPairSupported && !gatewayPairSupported
			? null
			: cctpPairSupported && !lifiPairSupported && !gatewayPairSupported
				? ('cctp' as const)
				: lifiPairSupported && !cctpPairSupported && !gatewayPairSupported
					? ('lifi' as const)
					: gatewayPairSupported && !cctpPairSupported && !lifiPairSupported
						? ('gateway' as const)
						: (protocolIntent ??
								(cctpPairSupported ? ('cctp' as const) : gatewayPairSupported ? ('gateway' as const) : ('lifi' as const))),
	)

	const protocolReason = $derived(
		!fromChainId || !toChainId
			? 'Select chains to choose a protocol'
			: cctpPairSupported && !lifiPairSupported && !gatewayPairSupported
				? 'Only CCTP supports this pair'
				: lifiPairSupported && !cctpPairSupported && !gatewayPairSupported
					? 'Only LI.FI supports this pair'
					: gatewayPairSupported && !cctpPairSupported && !lifiPairSupported
						? 'Only Gateway supports this pair'
						: protocolIntent === 'cctp'
							? 'Using CCTP (your preference)'
							: protocolIntent === 'lifi'
								? 'Using LI.FI (your preference)'
								: protocolIntent === 'gateway'
									? 'Using Gateway (your preference)'
									: 'Using CCTP (best route)',
	)

	const protocolOptions = $derived(
		(
			[
				{ bridgeId: 'cctp' as const, enabled: cctpPairSupported },
				{ bridgeId: 'lifi' as const, enabled: lifiPairSupported },
				{ bridgeId: 'gateway' as const, enabled: gatewayPairSupported },
			] as const
		)
			.filter((o) => o.enabled)
			.map((o) => ({
				bridgeId: o.bridgeId,
				...protocolsById[bridgeIdToProtocol[o.bridgeId]],
			})),
	)
	const anyMultiple = $derived(protocolOptions.length > 1)


	// Actions
	const setProtocolIntent = (value: BridgeProtocolId | null) => {
		if (action.type !== ActionType.Bridge) return
		action = {
			...action,
			params: { ...action.params, protocolIntent: value },
			protocolAction:
				value != null
					? { action: ActionType.Bridge, protocol: bridgeIdToProtocol[value] }
					: undefined,
		} as Action
	}


	// Components
	import CctpBridgeSettingsFieldset from './CctpBridgeSettingsFieldset.svelte'
	import LifiBridgeSettingsFieldset from './LifiBridgeSettingsFieldset.svelte'
</script>

{#if action.type === ActionType.Bridge}
	<div data-column="gap-3">
	{#if anyMultiple}
		<div data-column="gap-2">
			<div data-row="gap-2 align-center">
				<button
					type="button"
					data-card="radius-6 padding-3"
					data-selected={protocolIntent === null ? '' : undefined}
					onclick={() => setProtocolIntent(null)}
				>
					Auto
				</button>
				<span data-muted>or pick one:</span>
			</div>
			<div data-row="gap-2 wrap">
				{#each protocolOptions as option (option.bridgeId)}
					<button
						type="button"
						class="protocol-card"
						data-card="radius-6 padding-3"
						data-selected={option.bridgeId === activeProtocol ? '' : undefined}
						onclick={() => setProtocolIntent(option.bridgeId)}
					>
						<div data-row="gap-2 align-center justify-between">
							<strong>{option.shortLabel}</strong>
							{#if protocolIntent === null && option.bridgeId === activeProtocol}
								<span class="protocol-tag" data-tag>Best</span>
							{:else if protocolIntent === option.bridgeId}
								<span class="protocol-tag" data-tag data-variant="selected">Selected</span>
							{/if}
						</div>
						<div data-muted>{option.detail}</div>
					</button>
				{/each}
			</div>
		</div>
	{:else if activeProtocol}
		<p data-muted>Using {protocolsById[bridgeIdToProtocol[activeProtocol]].shortLabel}</p>
	{:else if fromChainId !== null && toChainId !== null}
		<p data-error>This chain pair is not supported by CCTP, LI.FI, or Gateway.</p>
	{:else}
		<p data-muted>{protocolReason}</p>
	{/if}

	{#if activeProtocol === 'cctp'}
		<CctpBridgeSettingsFieldset bind:action />
	{:else if activeProtocol === 'lifi'}
		<LifiBridgeSettingsFieldset bind:action />
	{/if}
	</div>
{/if}

<style>
	.protocol-card {
		gap: 0.35em;
		border: 1px solid transparent;
		text-align: left;
		transition:
			border 0.2s ease,
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.protocol-card:hover {
		transform: translateY(-1px);
	}

	.protocol-card[data-selected] {
		border-color: var(--color-border-input);
		box-shadow: var(--shadow-lg);
	}

	.protocol-tag {
		font-size: 0.75em;
		padding: 0.15em 0.6em;
		background: var(--color-success-bg);
		color: var(--color-success);
	}

	.protocol-tag[data-variant='selected'] {
		background: var(--color-bg-subtle);
		color: var(--color-text-muted);
	}
</style>
