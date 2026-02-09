<script lang="ts">
	// Types/constants
	import type { BridgeRoute } from '$/data/BridgeRoute.ts'
	import type { Transaction } from '@tanstack/db'
	import {
		BridgeTransactionStatus,
		type Transaction$Id,
	} from '$/data/Transaction.ts'
	import type { WalletRow } from '$/collections/Wallets.ts'
	import {
		BridgeOverallStatus,
		createInitialStatus,
		type BridgeStatus,
		TxState,
	} from '$/lib/bridge/txStatus.ts'
	import {
		insertTransaction,
		updateTransaction,
	} from '$/collections/BridgeTransactions.ts'
	import { executeSelectedRoute } from '$/api/lifi.ts'
	import { getTxUrl } from '$/constants/explorers.ts'
	import { toasts } from '$/lib/toast.svelte.ts'
	import { createOptimisticAction } from '@tanstack/svelte-db'


	// Props
	let {
		route,
		walletRow,
		walletAddress,
		fromChainId,
		toChainId,
		amount,
		executing = $bindable(false),
		status = $bindable({ overall: 'idle', steps: [] } as BridgeStatus),
		onExecute,
	}: {
		route: BridgeRoute,
		walletRow: WalletRow,
		walletAddress: `0x${string}`,
		fromChainId: number,
		toChainId: number,
		amount: bigint,
		executing?: boolean,
		status?: BridgeStatus,
		onExecute?: (fn: () => Promise<{ txHash?: `0x${string}` } | undefined>) => void,
	} = $props()


	// (Derived)
	const providerDetail = $derived({
		info: {
			uuid: walletRow.$id.rdns,
			name: walletRow.name,
			icon: walletRow.icon,
			rdns: walletRow.rdns,
		},
		provider: walletRow.provider,
	})


	// State
	let actionTx = $state<Transaction<Record<string, unknown>> | null>(null)
	const executeBridge = createOptimisticAction<{
		route: BridgeRoute,
		providerDetail: typeof providerDetail,
		walletAddress: `0x${string}`,
		fromChainId: number,
		toChainId: number,
		amount: bigint,
		onStatus: (s: BridgeStatus) => void,
	}>({
		onMutate: () => {},
		mutationFn: async ({
			route,
			providerDetail,
			walletAddress,
			fromChainId,
			toChainId,
			amount,
			onStatus: reportStatus,
		}) => {
			let txId: Transaction$Id | null = null

			try {
				const result = await executeSelectedRoute(
					providerDetail,
					route,
					(s) => {
						reportStatus(s)

						const hash = s.steps.find((st) => st.txHash)?.txHash
						if (hash && !txId) {
							txId = {
								address: walletAddress,
								sourceTxHash: hash,
								createdAt: Date.now(),
							}
							insertTransaction({
								$id: txId,
								fromChainId,
								toChainId,
								fromAmount: amount,
								toAmount: route.toAmount,
								destTxHash: null,
								status: BridgeTransactionStatus.Pending,
							})
						}
					},
				)

				const destHash = result.steps
					.flatMap(
						(s) =>
							(s.execution?.process ?? []) as {
								txHash?: string,
								chainId?: number,
							}[],
					)
					.find((p) => p.chainId === toChainId)?.txHash

				if (txId) {
					updateTransaction(txId, {
						status: BridgeTransactionStatus.Completed,
						destTxHash: destHash ?? null,
					})
				}

				return { txId, destHash }
			} catch (err) {
				if (txId) {
					updateTransaction(txId, { status: BridgeTransactionStatus.Failed })
				}
				throw err
			}
		},
	})


	// (Derived)
	const failed = $derived(actionTx?.state === 'failed')


	// Actions
	const handleExecute = async () => (await execute())

	$effect(() => {
		if (onExecute) {
			onExecute(handleExecute)
		}
	})

	$effect(() => {
		executing =
			actionTx?.state === 'pending' || actionTx?.state === 'persisting'
	})

	const execute = async () => {
		status = { overall: BridgeOverallStatus.InProgress, steps: [] }

		const loadingId = toasts.loading('Submitting transaction…')

		actionTx = executeBridge({
			route,
			providerDetail,
			walletAddress,
			fromChainId,
			toChainId,
			amount,
			onStatus: (s) => (status = s),
		})

		try {
			await actionTx!.isPersisted.promise
			toasts.dismiss(loadingId)
			if (status.overall === BridgeOverallStatus.Completed) {
				toasts.success('Bridge complete!', { title: 'Success' })
			}
		} catch (e) {
			toasts.dismiss(loadingId)
			toasts.error(e instanceof Error ? e.message : 'Bridge failed', {
				title: 'Error',
			})
		}
		const txHash = status.steps.find((step) => step.txHash)?.txHash
		return {
			txHash:
				typeof txHash === 'string' && txHash.startsWith('0x') ?
					txHash
				:	undefined,
		}
	}
</script>


{#if status.overall !== 'idle'}
	<div data-column="gap-2">
		{#each status.steps as step (step.step)}
			<div
				data-row="gap-1"
				class:muted={step.state === TxState.Pending}
				class:error={step.state === TxState.Failed}
				class:success={step.state === TxState.Success}
			>
				{step.state === 'success' ? '✓' : step.state === 'failed' ? '✗' : '…'}
				{step.step}
				{#if step.txHash}
					<a
						href={getTxUrl(step.chainId ?? fromChainId, step.txHash)}
						target="_blank"
						rel="noopener noreferrer"
						data-tx-hash={step.txHash}
					>{step.txHash.slice(0, 8)}…</a>
				{/if}
			</div>
		{/each}
		{#if status.overall === BridgeOverallStatus.Completed}
			<p class="success">Bridge complete!</p>
		{/if}
	</div>
{/if}

{#if failed}
	<p class="error">Transaction failed</p>
{/if}


<style>
	.muted {
		opacity: 0.6;
	}
	.error {
		color: var(--color-error);
	}
	.success {
		color: var(--color-success);
	}
</style>
