<script lang="ts">
	import type { BridgeRoute } from '$/collections/bridge-routes'
	import type { ProviderDetailType } from '$/lib/wallet'
	import type { BridgeStatus } from '$/lib/tx-status'
	import type { Transaction } from '@tanstack/db'
	import { createOptimisticAction } from '@tanstack/svelte-db'
	import { executeSelectedRoute } from '$/api/lifi'
	import { getTxUrl } from '$/constants/explorers'
	import { toasts } from '$/lib/toast.svelte'
	import { insertTransaction, updateTransaction, type Transaction$id } from '$/collections/transactions'

	let {
		route,
		connectedDetail,
		walletAddress,
		fromChainId,
		toChainId,
		amount,
		executing = $bindable(false),
	}: {
		route: BridgeRoute
		connectedDetail: ProviderDetailType
		walletAddress: `0x${string}`
		fromChainId: number
		toChainId: number
		amount: bigint
		executing?: boolean
	} = $props()

	// Progress state (updated via callback, not persisted)
	let status = $state<BridgeStatus>({ overall: 'idle', steps: [] })

	// Current action transaction for state tracking
	let actionTx = $state<Transaction<unknown> | null>(null)

	// Sync executing prop with action state
	$effect(() => {
		executing = actionTx?.state === 'pending' || actionTx?.state === 'persisting'
	})

	// Define the bridge action
	const executeBridge = createOptimisticAction<{
		route: BridgeRoute
		connectedDetail: ProviderDetailType
		walletAddress: `0x${string}`
		fromChainId: number
		toChainId: number
		amount: bigint
		onStatus: (s: BridgeStatus) => void
	}>({
		// No optimistic insert - we don't have the tx hash yet
		onMutate: () => {},
		mutationFn: async ({ route, connectedDetail, walletAddress, fromChainId, toChainId, amount, onStatus }) => {
			let txId: Transaction$id | null = null

			const result = await executeSelectedRoute(connectedDetail, route, (s) => {
				onStatus(s)

				// Insert transaction when we get the first tx hash
				const hash = s.steps.find((st) => st.txHash)?.txHash
				if (hash && !txId) {
					txId = { address: walletAddress, sourceTxHash: hash, createdAt: Date.now() }
					insertTransaction({
						$id: txId,
						fromChainId,
						toChainId,
						fromAmount: amount,
						toAmount: route.toAmount,
						destTxHash: null,
						status: 'pending',
					})
				}
			})

			// Find destination tx hash
			const destHash = result.steps
				.flatMap((s) => (s.execution?.process ?? []) as { txHash?: string; chainId?: number }[])
				.find((p) => p.chainId === toChainId)?.txHash

			// Update final status
			if (txId) {
				updateTransaction(txId, {
					status: onStatus.length > 0 ? 'completed' : 'completed',
					destTxHash: destHash ?? null,
				})
			}

			return { txId, destHash }
		},
	})

	// Derived state from action transaction
	const failed = $derived(actionTx?.state === 'failed')

	export const execute = async () => {
		status = { overall: 'in_progress', steps: [] }

		const loadingId = toasts.loading('Submitting transaction…')

		actionTx = executeBridge({
			route,
			connectedDetail,
			walletAddress,
			fromChainId,
			toChainId,
			amount,
			onStatus: (s) => { status = s },
		})

		try {
			await actionTx.isPersisted.promise
			toasts.dismiss(loadingId)
			if (status.overall === 'completed') {
				toasts.success('Bridge complete!', { title: 'Success' })
			}
		} catch (e) {
			toasts.dismiss(loadingId)
			toasts.error(e instanceof Error ? e.message : 'Bridge failed', { title: 'Error' })
		}
	}
</script>


{#if status.overall !== 'idle'}
	<div data-column="gap-1">
		{#each status.steps as step (step.step)}
			<div data-row="gap-1" class:muted={step.state === 'pending'} class:error={step.state === 'failed'} class:success={step.state === 'success'}>
				{step.state === 'success' ? '✓' : step.state === 'failed' ? '✗' : '…'}
				{step.step}
				{#if step.txHash}
					<a href={getTxUrl(step.chainId ?? fromChainId, step.txHash)} target="_blank" rel="noopener">{step.txHash.slice(0, 8)}…</a>
				{/if}
			</div>
		{/each}
		{#if status.overall === 'completed'}
			<p class="success">Bridge complete!</p>
		{/if}
	</div>
{/if}

{#if failed}
	<p class="error">Transaction failed</p>
{/if}


<style>
	.muted { opacity: 0.6; }
	.error { color: var(--color-error, #ef4444); }
	.success { color: var(--color-success, #22c55e); }
</style>
