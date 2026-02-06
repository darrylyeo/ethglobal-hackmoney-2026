<script lang="ts">
	import type { BridgeRoute } from '$/data/BridgeRoute'
	import type { WalletRow } from '$/collections/wallets'
	import type { EIP1193Provider } from '$/lib/wallet'
	import type { BridgeStatus } from '$/lib/tx-status'
	import type { Transaction } from '@tanstack/db'
	import { createOptimisticAction } from '@tanstack/svelte-db'
	import { executeSelectedRoute } from '$/api/lifi'
	import { getTxUrl } from '$/constants/explorers'
	import { toasts } from '$/lib/toast.svelte'
	import {
		insertTransaction,
		updateTransaction,
	} from '$/collections/transactions'
	import type { Transaction$Id } from '$/data/Transaction'

	const isHexHash = (value: unknown): value is `0x${string}` =>
		typeof value === 'string' && value.startsWith('0x')

	let {
		route,
		walletRow,
		walletAddress,
		fromChainId,
		toChainId,
		amount,
		executing = $bindable(false),
		onStatus,
		onExecute,
	}: {
		route: BridgeRoute
		walletRow: WalletRow
		walletAddress: `0x${string}`
		fromChainId: number
		toChainId: number
		amount: bigint
		executing?: boolean
		onStatus?: (s: BridgeStatus) => void
		onExecute?: (fn: () => Promise<{ txHash?: `0x${string}` } | undefined>) => void
	} = $props()

	// Build compatible ProviderDetailType for API
	const providerDetail = $derived({
		info: {
			uuid: walletRow.$id.rdns,
			name: walletRow.name,
			icon: walletRow.icon,
			rdns: walletRow.rdns,
		},
		provider: walletRow.provider,
	})

	// Progress state (updated via callback, not persisted)
	let status = $state<BridgeStatus>({ overall: 'idle', steps: [] })

	// Current action transaction for state tracking
	let actionTx = $state<Transaction<Record<string, unknown>> | null>(null)

	// Execute function for parent component
	const handleExecute = async () => {
		return await execute()
	}

	// Provide execute function to parent
	$effect(() => {
		if (onExecute) {
			onExecute(handleExecute)
		}
	})

	// Sync executing prop with action state
	$effect(() => {
		executing =
			actionTx?.state === 'pending' || actionTx?.state === 'persisting'
	})

	// Define the bridge action
	const executeBridge = createOptimisticAction<{
		route: BridgeRoute
		providerDetail: typeof providerDetail
		walletAddress: `0x${string}`
		fromChainId: number
		toChainId: number
		amount: bigint
		onStatus: (s: BridgeStatus) => void
	}>({
		// No optimistic insert - we don't have the tx hash yet
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
								status: 'pending',
							})
						}
					},
				)

				const destHash = result.steps
					.flatMap(
						(s) =>
							(s.execution?.process ?? []) as {
								txHash?: string
								chainId?: number
							}[],
					)
					.find((p) => p.chainId === toChainId)?.txHash

				if (txId) {
					updateTransaction(txId, {
						status: 'completed',
						destTxHash: destHash ?? null,
					})
				}

				return { txId, destHash }
			} catch (err) {
				if (txId) {
					updateTransaction(txId, { status: 'failed' })
				}
				throw err
			}
		},
	})

	// Derived state from action transaction
	const failed = $derived(actionTx?.state === 'failed')

	const execute = async () => {
		status = { overall: 'in_progress', steps: [] }

		const loadingId = toasts.loading('Submitting transaction…')

		actionTx = executeBridge({
			route,
			providerDetail,
			walletAddress,
			fromChainId,
			toChainId,
			amount,
			onStatus: (s) => {
				status = s
				onStatus?.(s)
			},
		})

		try {
			await actionTx!.isPersisted.promise
			toasts.dismiss(loadingId)
			if (status.overall === 'completed') {
				toasts.success('Bridge complete!', { title: 'Success' })
			}
		} catch (e) {
			toasts.dismiss(loadingId)
			toasts.error(e instanceof Error ? e.message : 'Bridge failed', {
				title: 'Error',
			})
		}
		const txHash = status.steps.find((step) => step.txHash)?.txHash
		return { txHash: isHexHash(txHash) ? txHash : undefined }
	}
</script>

{#if status.overall !== 'idle'}
	<div data-column="gap-1">
		{#each status.steps as step (step.step)}
			<div
				data-row="gap-1"
				class:muted={step.state === 'pending'}
				class:error={step.state === 'failed'}
				class:success={step.state === 'success'}
			>
				{step.state === 'success' ? '✓' : step.state === 'failed' ? '✗' : '…'}
				{step.step}
				{#if step.txHash}
					<a
						href={getTxUrl(step.chainId ?? fromChainId, step.txHash)}
						target="_blank"
						rel="noopener noreferrer"
						data-tx-hash={step.txHash}>{step.txHash.slice(0, 8)}…</a
					>
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
