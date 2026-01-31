<script lang="ts">
	// Types/constants
	import type { BridgeStatus, TxStep } from '$/lib/tx-status'
	import { getTxUrl } from '$/constants/explorers'

	// Props
	let {
		status,
		fromChainId,
		toChainId,
	}: {
		status: BridgeStatus
		fromChainId: number
		toChainId: number
	} = $props()

	const steps: { key: TxStep; label: string }[] = [
		{ key: 'approve', label: 'Approve' },
		{ key: 'send', label: 'Send' },
		{ key: 'confirm', label: 'Confirm' },
		{ key: 'complete', label: 'Complete' },
	]

	const getStepStatus = (stepKey: TxStep) =>
		status.steps.find((s) => s.step === stepKey)

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

{#if status.overall !== 'idle'}
	<div data-tx-status data-status={status.overall}>
		<ol data-tx-steps>
			{#each steps as { key, label } (key)}
				{@const stepStatus =
					key === 'complete' && status.overall === 'completed'
						? { step: key as TxStep, state: 'success' as const }
						: getStepStatus(key)}
				<li data-step={key} data-state={stepStatus?.state ?? 'pending'}>
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
							data-tx-link
						>
							{stepStatus.txHash.slice(0, 8)}…
						</a>
					{/if}
				</li>
			{/each}
		</ol>

		{#if status.overall === 'in_progress'}
			<p data-tx-elapsed>Elapsed: {elapsed}s</p>
			{#if status.estimatedDurationSeconds}
				<p data-tx-estimate>Est. {status.estimatedDurationSeconds}s total</p>
			{/if}
		{/if}

		{#if status.overall === 'failed'}
			{@const failedStep = status.steps.find((s) => s.state === 'failed')}
			{#if failedStep?.error}
				<p data-tx-error role="alert">{failedStep.error}</p>
			{/if}
		{/if}

		{#if status.overall === 'completed'}
			<p data-tx-success>Bridge complete!</p>
		{/if}
	</div>
{/if}

<style>
	[data-tx-steps] {
		display: flex;
		gap: 0.5em;
		list-style: none;
		padding: 0;
	}

	[data-tx-steps] li {
		display: flex;
		align-items: center;
		gap: 0.25em;
		opacity: 0.5;
	}

	[data-tx-steps] li[data-state='pending'] {
		opacity: 1;
	}

	[data-tx-steps] li[data-state='success'] {
		opacity: 1;
		color: var(--color-success, #22c55e);
	}

	[data-tx-steps] li[data-state='failed'] {
		opacity: 1;
		color: var(--color-error, #ef4444);
	}

	[data-tx-error] {
		color: var(--color-error, #ef4444);
	}

	[data-tx-success] {
		color: var(--color-success, #22c55e);
	}
</style>
