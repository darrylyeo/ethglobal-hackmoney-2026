<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import type { Network } from '$/constants/networks'

	// Context
	import { Button } from 'bits-ui'

	// Props
	let {
		activeProtocol,
		protocolReason,
		protocolIntent = $bindable(null),
		onProtocolIntentChange = null,
		disabled = false,
		cctpPairSupported,
		lifiPairSupported,
		selectedWallet,
		fromNetwork,
		toNetwork,
		canSendAmount,
	}: {
		activeProtocol: 'cctp' | 'lifi' | null
		protocolReason: string
		protocolIntent?: 'cctp' | 'lifi' | null
		onProtocolIntentChange?: ((value: 'cctp' | 'lifi' | null) => void) | null
		disabled?: boolean
		cctpPairSupported: boolean
		lifiPairSupported: boolean
		selectedWallet: ConnectedWallet | null
		fromNetwork: Network | null
		toNetwork: Network | null
		canSendAmount: boolean
	} = $props()

	// (Derived)
	const protocolLabel = $derived(
		activeProtocol === 'cctp'
			? 'CCTP'
			: activeProtocol === 'lifi'
				? 'LI.FI'
				: '—',
	)
	const protocolOptions = $derived(
		(
			[
				{
					id: 'cctp',
					label: 'CCTP',
					detail: 'Native USDC',
					enabled: cctpPairSupported,
				},
				{
					id: 'lifi',
					label: 'LI.FI',
					detail: 'Aggregated routes',
					enabled: lifiPairSupported,
				},
			] satisfies {
				id: 'cctp' | 'lifi'
				label: string
				detail: string
				enabled: boolean
			}[]
		).filter((option) => option.enabled),
	)

	// Actions
	const onProtocolIntent = (value: 'cctp' | 'lifi' | null) => (
		onProtocolIntentChange?.(value),
		(protocolIntent = value)
	)
</script>

<section data-card data-column="gap-3">
	<h3>Protocol Selection</h3>
	<div data-column="gap-2">
		<span class="protocol-badge" data-protocol={activeProtocol ?? undefined}>
			{protocolLabel}
		</span>
		<small data-muted>{protocolReason}</small>
	</div>

	{#if cctpPairSupported || lifiPairSupported}
		<div data-column="gap-2">
			<div data-row="gap-2 align-center justify-between">
				<strong>Available routes</strong>
				{#if cctpPairSupported && lifiPairSupported}
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
				{/if}
			</div>
			<div data-column="gap-2">
				{#each protocolOptions as option (option.id)}
					<button
						class="protocol-card"
						type="button"
						data-selected={option.id === activeProtocol ? '' : undefined}
						{disabled}
						onclick={() => {
							onProtocolIntent(option.id)
						}}
					>
						<div data-row="gap-2 align-center justify-between">
							<strong>{option.label}</strong>
							{#if protocolIntent === null && option.id === activeProtocol}
								<span class="protocol-tag">Best</span>
							{:else if protocolIntent === option.id}
								<span class="protocol-tag" data-variant="selected"
									>Selected</span
								>
							{/if}
						</div>
						<div data-muted>{option.detail}</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if fromNetwork && toNetwork && activeProtocol === null}
		<p data-error>This chain pair is not supported by CCTP or LI.FI.</p>
	{/if}

	{#if !selectedWallet}
		<p data-muted>Connect a wallet to continue</p>
	{/if}
</section>

<style>
	.protocol-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		padding: 0.25em 0.75em;
		background: var(--color-bg-subtle);
		font-size: 0.8em;
		font-weight: 600;

		&[data-protocol='cctp'] {
			background: var(--color-info-bg);
			color: var(--color-info);
		}

		&[data-protocol='lifi'] {
			background: var(--color-accent-bg);
			color: var(--color-primary);
		}
	}

	.protocol-card {
		display: grid;
		gap: 0.35em;
		border: 1px solid transparent;
		border-radius: 0.75em;
		padding: 0.75em;
		background: var(--color-bg-subtle);
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
		border-radius: 999px;
		padding: 0.15em 0.6em;
		background: var(--color-success-bg);
		color: var(--color-success);
		font-size: 0.75em;
		font-weight: 600;

		&[data-variant='selected'] {
			background: var(--color-bg-subtle);
			color: var(--color-text-muted);
		}
	}
</style>
