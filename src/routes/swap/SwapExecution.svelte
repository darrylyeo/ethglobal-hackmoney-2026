<script lang="ts">
	import type { SwapQuote } from '$/collections/swap-quotes'
	import type { EIP1193Provider } from '$/lib/wallet'
	import { createOptimisticAction } from '@tanstack/svelte-db'
	import { executeSwap } from '$/api/uniswap'
	import { getTxUrl } from '$/constants/networks'
	import { toasts } from '$/lib/toast.svelte'
	import { insertTransaction, updateTransaction, type Transaction$id } from '$/collections/transactions'

	let {
		quote,
		walletProvider,
		walletAddress,
		amount,
		executing = $bindable(false),
	}: {
		quote: SwapQuote
		walletProvider: EIP1193Provider
		walletAddress: `0x${string}`
		amount: bigint
		executing?: boolean
	} = $props()

	let status = $state<{ overall: 'idle' | 'in_progress' | 'completed' | 'failed'; txHash?: `0x${string}`; error?: string }>({ overall: 'idle' })
	let actionTx = $state<ReturnType<typeof runExecute> | null>(null)

	$effect(() => {
		executing = status.overall === 'in_progress'
	})

	const runExecute = createOptimisticAction<{
		quote: SwapQuote
		provider: EIP1193Provider
		recipient: `0x${string}`
		onStatus: (s: { overall: string; txHash?: `0x${string}`; error?: string }) => void
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
			const txId: Transaction$id = { address: recipient, sourceTxHash: result.txHash, createdAt: Date.now() }
			insertTransaction({
				$id: txId,
				fromChainId: quote.chainId,
				toChainId: quote.chainId,
				fromAmount: amount,
				toAmount: quote.amountOut,
				destTxHash: result.txHash,
				status: 'pending',
			})
			updateTransaction(txId, { status: 'completed', destTxHash: result.txHash })
			return result
		},
	})

	export const execute = async () => {
		status = { overall: 'in_progress' }
		const loadingId = toasts.loading('Submitting swap…')
		actionTx = runExecute({
			quote,
			provider: walletProvider,
			recipient: walletAddress,
			onStatus: (s) => { status = s },
		})
		try {
			await actionTx!.isPersisted.promise
			toasts.dismiss(loadingId)
			status = { overall: 'completed', txHash: status.txHash }
			toasts.success('Swap complete!', { title: 'Success' })
		} catch (e) {
			toasts.dismiss(loadingId)
			status = { overall: 'failed', error: e instanceof Error ? e.message : String(e) }
			toasts.error(e instanceof Error ? e.message : 'Swap failed', { title: 'Error' })
		}
	}
</script>

{#if status.overall !== 'idle'}
	<div data-column="gap-1">
		{#if status.txHash}
			<a href={getTxUrl(quote.chainId, status.txHash)} target="_blank" rel="noopener">{status.txHash.slice(0, 8)}…</a>
		{/if}
		{#if status.overall === 'completed'}
			<p>Swap complete!</p>
		{:else if status.overall === 'failed'}
			<p data-error>{status.error}</p>
		{/if}
	</div>
{/if}
