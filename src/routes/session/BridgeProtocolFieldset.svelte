<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import { Protocol, ProtocolTag, protocolTagLabels, protocolsById } from '$/constants/protocols.ts'
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
	const rows = $derived([
		{ type: 'auto' as const },
		...protocolOptions.map((o) => ({ type: 'protocol' as const, option: o })),
	])


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
	import Icon from '$/components/Icon.svelte'
	import CctpBridgeSettingsFieldset from './CctpBridgeSettingsFieldset.svelte'
	import LifiBridgeSettingsFieldset from './LifiBridgeSettingsFieldset.svelte'
</script>

{#if action.type === ActionType.Bridge}
	<div data-column="gap-3">
	{#if anyMultiple}
		<div data-column="gap-1">
			{#each rows as row (row.type === 'auto' ? 'auto' : row.option.bridgeId)}
				{#if row.type === 'auto'}
					<button
						type="button"
						class="protocol-row"
						data-card="radius-6 padding-3"
						data-selected={protocolIntent === null ? '' : undefined}
						onclick={() => setProtocolIntent(null)}
					>
						Auto
					</button>
				{:else}
					<div
						class="protocol-row"
						data-card="radius-6 padding-3"
						data-row="gap-2 align-center wrap"
						data-selected={row.option.bridgeId === activeProtocol ? '' : undefined}
					>
						<button
							type="button"
							class="protocol-row-main"
							data-row="gap-2 align-center"
							onclick={() => setProtocolIntent(row.option.bridgeId)}
						>
							{#if row.option.icon.includes('/')}
								<Icon class="protocol-icon" src={row.option.icon} size={20} alt="" />
							{:else}
								<Icon class="protocol-icon" icon={row.option.icon} size={20} alt="" />
							{/if}
							<div data-column="gap-0">
								<strong>{row.option.label}</strong>
								<div data-muted>{row.option.detail}</div>
							</div>
						</button>
						{#each ('tags' in row.option ? row.option.tags : []) as tagId (tagId)}
							<button
								type="button"
								class="protocol-tag"
								data-tag
								onclick={() => setProtocolIntent(row.option.bridgeId)}
							>
								{protocolTagLabels[tagId as ProtocolTag]}
							</button>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	{:else if activeProtocol}
		<p data-muted>Using {protocolsById[bridgeIdToProtocol[activeProtocol]].label}</p>
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
	.protocol-row {
		gap: 0.35em;
		border: 1px solid transparent;
		text-align: left;
		transition: border 0.2s ease, box-shadow 0.2s ease;
	}

	.protocol-row[data-selected] {
		border-color: var(--color-border-input);
		box-shadow: var(--shadow-lg);
	}

	.protocol-row-main {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.protocol-row :global(.protocol-icon) {
		flex-shrink: 0;
	}

	.protocol-tag {
		cursor: pointer;
		font-size: 0.75em;
		padding: 0.15em 0.6em;
		background: var(--color-success-bg);
		color: var(--color-success);
	}
</style>
