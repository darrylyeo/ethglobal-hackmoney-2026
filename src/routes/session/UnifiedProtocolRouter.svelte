<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import { Protocol, protocolSpecs } from '$/constants/intents.ts'
	import type { Network } from '$/constants/networks.ts'

	type BridgeProtocolId = 'cctp' | 'lifi' | 'gateway'

	const bridgeProtocolForId: Record<BridgeProtocolId, Protocol> = {
		cctp: Protocol.Cctp,
		lifi: Protocol.LiFi,
		gateway: Protocol.Gateway,
	}


	// Context
	import { Button } from 'bits-ui'


	// Props
	let {
		activeProtocol,
		protocolReason,
		protocolIntent = $bindable(null),
		disabled = false,
		cctpPairSupported,
		lifiPairSupported,
		gatewayPairSupported,
		selectedWallet,
		fromNetwork,
		toNetwork,
		canSendAmount,
	}: {
		activeProtocol: BridgeProtocolId | null
		protocolReason: string
		protocolIntent?: BridgeProtocolId | null
		disabled?: boolean
		cctpPairSupported: boolean
		lifiPairSupported: boolean
		gatewayPairSupported: boolean
		selectedWallet: ConnectedWallet | null
		fromNetwork: Network | null
		toNetwork: Network | null
		canSendAmount: boolean,
	} = $props()


	// (Derived)
	const anyMultiple = $derived(
		[cctpPairSupported, lifiPairSupported, gatewayPairSupported].filter(Boolean)
			.length > 1,
	)
	const protocolOptions = $derived(
		([
			{ id: 'cctp' as const, enabled: cctpPairSupported },
			{ id: 'lifi' as const, enabled: lifiPairSupported },
			{ id: 'gateway' as const, enabled: gatewayPairSupported },
		])
			.filter(p => p.enabled)
			.map(p => ({
				...p,
				...protocolSpecs[bridgeProtocolForId[p.id]],
			})),
	)


	// Actions
	const onProtocolIntent = (
		value: BridgeProtocolId | null,
	) => (protocolIntent = value)
</script>


<section data-card data-column="gap-3">
	{#if anyMultiple}
		<h3>Protocol</h3>
		<div data-column="gap-2">
			<div data-row="gap-2 align-center">
				<Button.Root
					type="button"
					data-selected={protocolIntent === null ? '' : undefined}
					{disabled}
					onclick={() => {
						onProtocolIntent(null)
					}}
				>
					Auto
				</Button.Root>
				<span data-muted>or pick one:</span>
			</div>
		<div data-row="gap-2 wrap">
			{#each protocolOptions as option (option.id)}
				<button
					data-card="radius-6 padding-3"
					class="protocol-card"
					type="button"
					data-selected={option.id === activeProtocol ? '' : undefined}
					{disabled}
					onclick={() => {
						onProtocolIntent(option.id)
					}}
				>
					<div data-row="gap-2 align-center justify-between">
						<strong>{option.shortLabel}</strong>
						{#if protocolIntent === null && option.id === activeProtocol}
							<span
								data-tag
								class="protocol-tag"
								>Best</span
							>
						{:else if protocolIntent === option.id}
							<span
								data-tag
								class="protocol-tag"
								data-variant="selected"
								>Selected</span
							>
						{/if}
					</div>
					<div data-muted>{option.detail}</div>
				</button>
			{/each}
		</div>
		</div>
	{:else if activeProtocol}
		<p data-muted>Using {protocolSpecs[bridgeProtocolForId[activeProtocol]].shortLabel}</p>
	{:else if fromNetwork && toNetwork}
		<p data-error>This chain pair is not supported by CCTP, LI.FI, or Gateway.</p>
	{:else}
		<p data-muted>{protocolReason}</p>
	{/if}

	{#if !selectedWallet}
		<p data-muted>Connect a wallet to continue</p>
	{/if}
</section>


<style>
	.protocol-card {
		gap: 0.35em;
		border: 1px solid transparent;
		text-align: left;
		transition:
			border 0.2s ease,
			transform 0.2s ease,
			box-shadow 0.2s ease;

		&:hover {
			transform: translateY(-1px);
		}

		&[data-selected] {
			border-color: var(--color-border-input);
			box-shadow: var(--shadow-lg);
		}
	}

	.protocol-tag {
		font-size: 0.75em;
		padding: 0.15em 0.6em;
		background: var(--color-success-bg);
		color: var(--color-success);

		&[data-variant='selected'] {
			background: var(--color-bg-subtle);
			color: var(--color-text-muted);
		}
	}
</style>
