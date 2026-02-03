<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import type { Network } from '$/constants/networks'

	// Context
	import { Button } from 'bits-ui'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'

	// Props
	let {
		activeProtocol,
		protocolReason,
		protocolIntent = $bindable(null),
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
		cctpPairSupported: boolean
		lifiPairSupported: boolean
		selectedWallet: ConnectedWallet | null
		fromNetwork: Network | null
		toNetwork: Network | null
		canSendAmount: boolean
	} = $props()

	// (Derived)
	const canContinue = $derived(
		Boolean(activeProtocol && canSendAmount && selectedWallet),
	)
	const protocolLabel = $derived(
		activeProtocol === 'cctp'
			? 'CCTP'
			: activeProtocol === 'lifi'
				? 'LI.FI'
				: '—',
	)
	const protocolHref = $derived(
		activeProtocol === 'cctp'
			? '/bridge/cctp'
			: activeProtocol === 'lifi'
				? '/bridge/lifi'
				: null,
	)
	const protocolOptions = $derived(
		([
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
		}[]).filter((option) => option.enabled),
	)

	// Actions
	const onContinue = () => {
		if (!protocolHref) return
		goto(resolve(protocolHref))
	}
</script>

<section data-card data-column="gap-3">
	<h3>Protocol</h3>
	<div data-column="gap-2">
		<span
			class="protocol-badge"
			data-protocol={activeProtocol ?? undefined}
		>
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
						onclick={() => {
							protocolIntent = null
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
						onclick={() => {
							protocolIntent = option.id
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

	<Button.Root type="button" disabled={!canContinue} onclick={onContinue}>
		{activeProtocol ? 'Continue' : 'Select chains'}
	</Button.Root>
</section>

<style>
	.protocol-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		padding: 0.25em 0.75em;
		background: var(--color-bg-elevated, #f8fafc);
		font-size: 0.8em;
		font-weight: 600;

		&[data-protocol='cctp'] {
			background: #e0f2fe;
			color: #0284c7;
		}

		&[data-protocol='lifi'] {
			background: #f3e8ff;
			color: #7e22ce;
		}
	}

	.protocol-card {
		display: grid;
		gap: 0.35em;
		border: 1px solid transparent;
		border-radius: 0.75em;
		padding: 0.75em;
		background: var(--color-bg-elevated, #f8fafc);
		text-align: left;
		transition:
			border 0.2s ease,
			transform 0.2s ease,
			box-shadow 0.2s ease;

		&:hover {
			transform: translateY(-1px);
		}

		&[data-selected] {
			border-color: var(--color-border-strong, #cbd5f5);
			box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
		}
	}

	.protocol-tag {
		border-radius: 999px;
		padding: 0.15em 0.6em;
		background: #dcfce7;
		color: #15803d;
		font-size: 0.75em;
		font-weight: 600;

		&[data-variant='selected'] {
			background: #e2e8f0;
			color: #475569;
		}
	}
</style>
