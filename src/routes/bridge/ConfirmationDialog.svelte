<script lang="ts">
	// Types/constants
	import type { NormalizedQuote, NormalizedRoute } from '$/api/lifi'
	import type { LiFiStep } from '@lifi/sdk'

	// Functions
	import { extractFeeBreakdown } from '$/api/lifi'
	import { Button, Checkbox, Dialog } from 'bits-ui'
	import { networksByChainId } from '$/constants/networks'
	import { formatTokenAmount, formatSmallestToDecimal } from '$/lib/format'

	// Props
	let {
		open = $bindable(false),
		quote = null,
		quoteStep = null,
		route = null,
		fromNetworkId,
		toNetworkId,
		fromAmount,
		fromAddress,
		toAddress,
		slippage,
		onConfirm,
		onCancel,
	}: {
		open?: boolean
		quote?: NormalizedQuote | null
		quoteStep?: LiFiStep | null
		route?: NormalizedRoute | null
		fromNetworkId: number
		toNetworkId: number
		fromAmount: string
		fromAddress: `0x${string}`
		toAddress: `0x${string}`
		slippage: number
		onConfirm: () => void
		onCancel: () => void
	} = $props()

	// State
	let acknowledged = $state(false)

	// (Derived)
	const fromNetworkName = $derived(
		networksByChainId[fromNetworkId]?.name ?? `Network ${fromNetworkId}`,
	)
	const toNetworkName = $derived(
		networksByChainId[toNetworkId]?.name ?? `Network ${toNetworkId}`,
	)
	const isDifferentRecipient = $derived(
		toAddress.toLowerCase() !== fromAddress.toLowerCase(),
	)
	const isHighSlippage = $derived(slippage > 0.01)
	const estimatedToAmount = $derived(
		route?.toAmount ?? quote?.estimatedToAmount ?? '0',
	)
	const fromAmountUsd = $derived(
		route?.originalRoute?.fromAmountUSD ??
			quoteStep?.estimate?.fromAmountUSD ??
			'0',
	)
	const isLargeAmount = $derived(parseFloat(fromAmountUsd) > 10_000)
	const hasWarnings = $derived(
		isDifferentRecipient || isHighSlippage || isLargeAmount,
	)
	const toAmountMin = $derived(
		route?.toAmountMin ??
			(
				(BigInt(estimatedToAmount) *
					BigInt(Math.round((1 - slippage) * 1_000_000))) /
				1_000_000n
			).toString(),
	)
	const fees = $derived(
		extractFeeBreakdown({
			steps: route?.originalRoute?.steps ?? (quoteStep ? [quoteStep] : []),
			fromAmountUSD: fromAmountUsd,
		}),
	)
	const estimatedDurationSeconds = $derived(
		route?.estimatedDurationSeconds ??
			quoteStep?.estimate?.executionDuration ??
			0,
	)
	const toolNames = $derived(
		route
			? [...new Set(route.steps.map((s) => s.toolName))].join(' → ')
			: quoteStep?.toolDetails?.name ?? 'Bridge',
	)

	// Actions
	const handleConfirm = () => {
		if (acknowledged) {
			onConfirm()
			open = false
		}
	}
	const handleCancel = () => {
		acknowledged = false
		onCancel()
		open = false
	}

	$effect(() => {
		if (open) acknowledged = false
	})
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay data-dialog-overlay />
		<Dialog.Content data-dialog-content aria-describedby="confirm-desc">
			<Dialog.Title>Confirm Bridge Transaction</Dialog.Title>
			<Dialog.Description id="confirm-desc" class="sr-only">
				Review and confirm your bridge transaction details
			</Dialog.Description>

			<dl data-confirm-details data-card="secondary padding-3">
				<dt data-muted>From</dt>
				<dd>
					<strong>{formatSmallestToDecimal(fromAmount, 6)} USDC</strong>
					on {fromNetworkName}
				</dd>

				<dt data-confirm-arrow data-muted aria-hidden="true">↓</dt>
				<dd aria-hidden="true"></dd>

				<dt data-muted>To</dt>
				<dd>
					<strong>~{formatTokenAmount(estimatedToAmount, 6)} USDC</strong>
					on {toNetworkName}
				</dd>

				<dt data-muted>Min. received</dt>
				<dd>{formatTokenAmount(toAmountMin, 6)} USDC</dd>

				<dt data-muted>Recipient</dt>
				<dd>
					{toAddress.slice(0, 8)}…{toAddress.slice(-6)}
					{#if isDifferentRecipient}
						<span data-badge="warning">Different address</span>
					{/if}
				</dd>

				<dt data-muted>Bridge</dt>
				<dd>{toolNames}</dd>

				<dt data-muted>Est. time</dt>
				<dd>~{Math.ceil(estimatedDurationSeconds / 60)} min</dd>

				<dt data-muted>Slippage</dt>
				<dd>
					{(slippage * 100).toFixed(1)}%
					{#if isHighSlippage}
						<span data-badge="warning">High</span>
					{/if}
				</dd>

				<dt data-muted>Fees</dt>
				<dd>~${fees.totalUsd}</dd>
			</dl>

			{#if hasWarnings}
				<div data-confirm-warnings role="alert" data-column="gap-2">
					<strong>⚠️ Please note:</strong>
					<ul>
						{#if isDifferentRecipient}
							<li>Tokens will be sent to a <strong>different address</strong> than your wallet.</li>
						{/if}
						{#if isHighSlippage}
							<li>High slippage ({(slippage * 100).toFixed(1)}%) may result in receiving less than expected.</li>
						{/if}
						{#if isLargeAmount}
							<li>This is a large transaction (>${Math.floor(parseFloat(fromAmountUsd)).toLocaleString()}).</li>
						{/if}
					</ul>
				</div>
			{/if}

			<div data-row="gap-2 align-center">
				<Checkbox.Root bind:checked={acknowledged} id="confirm-checkbox">
					{#snippet children({ checked })}
						{#if checked}✓{/if}
					{/snippet}
				</Checkbox.Root>
				<label for="confirm-checkbox">
					I understand this transaction cannot be reversed once submitted
				</label>
			</div>

			<div data-row="gap-3 end">
				<Button.Root type="button" onclick={handleCancel} data-variant="secondary">
					Cancel
				</Button.Root>
				<Button.Root
					type="button"
					onclick={handleConfirm}
					disabled={!acknowledged}
					data-variant="primary"
				>
					Confirm Bridge
				</Button.Root>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	[data-dialog-overlay] {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 100;
	}

	[data-dialog-content] {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-bg-page);
		border-radius: 0.75em;
		padding: 1.5em;
		max-width: 480px;
		width: 90vw;
		max-height: 90vh;
		overflow-y: auto;
		z-index: 101;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	[data-confirm-details] {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25em 1em;
		margin: 1em 0;
		background: var(--color-bg-subtle);
	}

	[data-confirm-details] dt,
	[data-confirm-details] dd {
		margin: 0;
	}

	[data-confirm-arrow] {
		grid-column: 1 / -1;
		text-align: center;
		font-size: 1.25em;
	}

	[data-confirm-details] dd[aria-hidden="true"] {
		display: none;
	}

	[data-confirm-warnings] {
		padding: 1em;
		background: var(--color-warning-bg, #fef3c7);
		border-radius: 0.5em;
		margin: 1em 0;
	}

	[data-confirm-warnings] ul {
		margin: 0.5em 0 0 1.5em;
		padding: 0;
	}

	[data-confirm-warnings] li {
		margin: 0.25em 0;
	}

	[data-badge="warning"] {
		background: var(--color-warning-bg, #fef3c7);
		color: var(--color-warning, #d97706);
	}
</style>
