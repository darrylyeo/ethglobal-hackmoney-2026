<script lang="ts">
	// Types/constants
	import type { BridgeStatus, TxStep } from '$/lib/tx-status'
	import { getTxUrl } from '$/constants/explorers'

	// Props
	let {
		status,
		fromNetworkId,
		toNetworkId,
	}: {
		status: BridgeStatus
		fromNetworkId: number
		toNetworkId: number
	} = $props()

	const steps: { key: TxStep; label: string }[] = [
		{ key: 'approve', label: 'Approve' },
		{ key: 'send', label: 'Send' },
		{ key: 'confirm', label: 'Confirm' },
		{ key: 'complete', label: 'Complete' },
	]

	const getStepStatus = (stepKey: TxStep) =>
		status.steps.find((s) => s.step === stepKey)
	const currentStepLabel = $derived(
		status.overall === 'in_progress'
			? (steps.find((s) => getStepStatus(s.key)?.state === 'in_progress')?.label ?? 'Processing')
			: '',
	)
	const errorMessage = $derived(
		status.overall === 'failed'
			? (status.steps.find((s) => s.state === 'failed')?.error ?? 'Transaction failed')
			: '',
	)

	let tick = $state(0)
	$effect(() => {
		if (status.overall !== 'in_progress') return
		const id = setInterval(() => {
			tick++
		}, 1000)
		return () => clearInterval(id)
	})
	const elapsed = $derived(
		(void tick,
		status.steps[0]?.startedAt
			? Math.floor((Date.now() - status.steps[0].startedAt) / 1000)
			: 0),
	)
</script>

<div
	aria-live="polite"
	aria-atomic="true"
	class="sr-only"
>
	{#if status.overall === 'in_progress'}
		Transaction in progress. {currentStepLabel}
	{:else if status.overall === 'completed'}
		Bridge complete. Tokens sent successfully.
	{:else if status.overall === 'failed'}
		Transaction failed. {errorMessage}
	{/if}
</div>
{#if status.overall !== 'idle'}
	<div data-tx-status data-status={status.overall} data-column="gap-2">
		<ol data-tx-steps data-row="gap-2">
			{#each steps as { key, label } (key)}
				{@const stepStatus =
					key === 'complete' && status.overall === 'completed'
						? { step: key as TxStep, state: 'success' as const }
						: getStepStatus(key)}
				<li data-step={key} data-state={stepStatus?.state ?? 'pending'} data-row="gap-1 align-center">
					<span data-step-indicator>
						{#if stepStatus?.state === 'success'}
							✓
						{:else if stepStatus?.state === 'failed'}
							✗
						{:else if stepStatus?.state === 'pending'}
							⋯
						{:else}
							○
						{/if}
					</span>
					<span data-step-label>{label}</span>
					{#if stepStatus?.txHash && stepStatus?.chainId}
						<a
							href={getTxUrl(stepStatus.chainId, stepStatus.txHash)}
							target="_blank"
							rel="noopener noreferrer"
							data-link
						>
							{stepStatus.txHash.slice(0, 8)}…
						</a>
					{/if}
				</li>
			{/each}
		</ol>

		{#if status.overall === 'in_progress'}
			<p data-muted>Elapsed: {elapsed}s</p>
			{#if status.estimatedDurationSeconds}
				<p data-muted>Est. {status.estimatedDurationSeconds}s total</p>
			{/if}
		{/if}

		{#if status.overall === 'failed'}
			{@const failedStep = status.steps.find((s) => s.state === 'failed')}
			{#if failedStep?.error}
				<p data-error role="alert">{failedStep.error}</p>
			{/if}
		{/if}

		{#if status.overall === 'completed'}
			<p data-tx-success>Bridge complete!</p>
		{/if}
	</div>
{/if}

<style>
	[data-tx-steps] {
		list-style: none;
		padding: 0;
	}

	[data-tx-steps] li {
		opacity: 0.5;
	}

	[data-tx-steps] li[data-state='pending'],
	[data-tx-steps] li[data-state='success'],
	[data-tx-steps] li[data-state='failed'] {
		opacity: 1;
	}

	[data-tx-steps] li[data-state='success'] {
		color: var(--color-success, #22c55e);
	}

	[data-tx-steps] li[data-state='failed'] {
		color: var(--color-error, #ef4444);
	}

	[data-tx-success] {
		color: var(--color-success, #22c55e);
	}
</style>
