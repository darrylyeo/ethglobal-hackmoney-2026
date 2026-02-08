<script lang="ts">
	// Types/constants
	import type { SwapQuote } from '$/data/SwapQuote.ts'
	import type { Transaction$Id } from '$/data/Transaction.ts'
	import type { EIP1193Provider } from '$/lib/wallet.ts'
	import {
		insertTransaction,
		updateTransaction,
	} from '$/collections/transactions.ts'
	import { getTxUrl } from '$/constants/explorers.ts'
	import { toasts } from '$/lib/toast.svelte.ts'
	import { createOptimisticAction } from '@tanstack/svelte-db'
	import { executeSwap } from '$/api/uniswap.ts'

	type SwapExecutionStatus = {
		overall: 'idle' | 'in_progress' | 'completed' | 'failed'
		txHash?: `0x${string}`
		error?: string
	}


	// Props
	let {
		quote,
		walletProvider,
		walletAddress,
		amount,
		executing = $bindable(false),
		onExecute,
	}: {
		quote: SwapQuote
		walletProvider: EIP1193Provider
		walletAddress: `0x${string}`
		amount: bigint
		executing?: boolean
		onExecute?: (fn: () => Promise<{ txHash?: `0x${string}` } | undefined>) => void
	} = $props()


	// State
	let status = $state<SwapExecutionStatus>({ overall: 'idle' })
	let actionTx = $state<ReturnType<typeof runExecute> | null>(null)


	// (Derived)
	$effect(() => {
		executing = status.overall === 'in_progress'
	})


	// Functions
	const runExecute = createOptimisticAction<{
		quote: SwapQuote
		provider: EIP1193Provider
		recipient: `0x${string}`
		onStatus: (s: SwapExecutionStatus) => void
	}>({
		onMutate: () => {},
		mutationFn: async ({ quote, provider, recipient, onStatus }) => {
			const deadline = Math.floor(Date.now() / 1000) + 1200
			const result = await executeSwap({
				provider,
				quote,
				recipient,
				deadline,
				onStatusChange: onStatus,
			})
			const txId: Transaction$Id = {
				address: recipient,
				sourceTxHash: result.txHash,
				createdAt: Date.now(),
			}
			insertTransaction({
				$id: txId,
				fromChainId: quote.chainId,
				toChainId: quote.chainId,
				fromAmount: amount,
				toAmount: quote.amountOut,
				destTxHash: result.txHash,
				status: 'pending',
			})
			updateTransaction(txId, {
				status: 'completed',
				destTxHash: result.txHash,
			})
			return result
		},
	})

	const execute = async () => {
		status = { overall: 'in_progress' }
		const loadingId = toasts.loading('Submitting swap…')
		actionTx = runExecute({
			quote,
			provider: walletProvider,
			recipient: walletAddress,
			onStatus: (s) => {
				status = s
			},
		})
		try {
			await actionTx!.isPersisted.promise
			toasts.dismiss(loadingId)
			status = { overall: 'completed', txHash: status.txHash }
			toasts.success('Swap complete!', { title: 'Success' })
		} catch (e) {
			toasts.dismiss(loadingId)
			status = {
				overall: 'failed',
				error: e instanceof Error ? e.message : String(e),
			}
			toasts.error(e instanceof Error ? e.message : 'Swap failed', {
				title: 'Error',
			})
		}
		return { txHash: status.txHash }
	}


	// Actions
	const handleExecute = async () => await execute()

	$effect(() => {
		if (onExecute) {
			onExecute(handleExecute)
		}
	})
</script>


{#if status.overall !== 'idle'}
	<div data-column="gap-1">
		{#if status.txHash}
			<a
				href={getTxUrl(quote.chainId, status.txHash)}
				target="_blank"
				rel="noopener noreferrer"
				data-tx-hash={status.txHash}
			>{status.txHash.slice(0, 8)}…</a>
		{/if}
		{#if status.overall === 'completed'}
			<p>Swap complete!</p>
		{:else if status.overall === 'failed'}
			<p data-error>{status.error}</p>
		{/if}
	</div>
{/if}
