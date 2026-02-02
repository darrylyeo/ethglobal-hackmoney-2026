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
		selectedActor,
		fromNetwork,
		toNetwork,
		recipient,
		canSendAmount,
	}: {
		activeProtocol: 'cctp' | 'lifi' | null
		protocolReason: string
		protocolIntent?: 'cctp' | 'lifi' | null
		cctpPairSupported: boolean
		lifiPairSupported: boolean
		selectedWallet: ConnectedWallet | null
		selectedActor: `0x${string}` | null
		fromNetwork: Network | null
		toNetwork: Network | null
		recipient: `0x${string}` | null
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

	// Actions
	const onContinue = () => {
		if (!protocolHref) return
		goto(resolve(protocolHref))
	}
</script>

<section data-card data-column="gap-3">
	<h3>Protocol Selection</h3>
	<div data-column="gap-2">
		<span data-badge data-protocol={activeProtocol ?? undefined}>
			{protocolLabel}
		</span>
		<small data-muted>{protocolReason}</small>
	</div>

	{#if cctpPairSupported && lifiPairSupported}
		<div data-column="gap-2">
			<strong>Preference</strong>
			<div data-row="gap-2">
				<Button.Root
					type="button"
					data-selected={protocolIntent === 'cctp' ? '' : undefined}
					onclick={() => {
						protocolIntent = 'cctp'
					}}
				>
					Prefer CCTP
				</Button.Root>
				<Button.Root
					type="button"
					data-selected={protocolIntent === 'lifi' ? '' : undefined}
					onclick={() => {
						protocolIntent = 'lifi'
					}}
				>
					Prefer LI.FI
				</Button.Root>
				<Button.Root
					type="button"
					data-selected={protocolIntent === null ? '' : undefined}
					onclick={() => {
						protocolIntent = null
					}}
				>
					Auto
				</Button.Root>
			</div>
		</div>
	{/if}

	{#if fromNetwork && toNetwork && activeProtocol === null}
		<p data-error>This chain pair is not supported by CCTP or LI.FI.</p>
	{/if}

	<div data-column="gap-2">
		<strong>Summary</strong>
		<dl data-summary>
			<dt>From</dt>
			<dd>{fromNetwork?.name ?? '—'}</dd>
			<dt>To</dt>
			<dd>{toNetwork?.name ?? '—'}</dd>
			<dt>Recipient</dt>
			<dd>{recipient ?? selectedActor ?? '—'}</dd>
		</dl>
	</div>

	{#if !selectedWallet}
		<p data-muted>Connect a wallet to continue</p>
	{/if}

	<Button.Root type="button" disabled={!canContinue} onclick={onContinue}>
		{activeProtocol === 'cctp'
			? 'Continue to CCTP'
			: activeProtocol === 'lifi'
				? 'Continue to LI.FI'
				: 'Select chains'}
	</Button.Root>
</section>

<style>
	[data-summary] {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25em 1em;
	}

	[data-summary] dt,
	[data-summary] dd {
		margin: 0;
	}

	[data-summary] dt {
		opacity: 0.7;
	}

	[data-badge] {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		padding: 0.25em 0.75em;
		background: var(--color-bg-elevated, #f8fafc);
		font-size: 0.8em;
		font-weight: 600;
	}

	[data-badge][data-protocol='cctp'] {
		background: #e0f2fe;
		color: #0284c7;
	}

	[data-badge][data-protocol='lifi'] {
		background: #f3e8ff;
		color: #7e22ce;
	}
</style>
