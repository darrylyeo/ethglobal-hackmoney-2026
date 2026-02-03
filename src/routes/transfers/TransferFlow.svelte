<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'

	// Functions
	import { encodeTransferCall } from '$/api/voltaire'
	import { sendTransfer } from '$/api/yellow'
	import { formatSmallestToDecimal } from '$/lib/format'

	// State
	import {
		insertTransaction,
		updateTransaction,
	} from '$/collections/transactions'
	import type { Transaction$Id } from '$/data/Transaction'
	import { yellowState } from '$/state/yellow.svelte'

	// Props
	let {
		walletConnection,
		fromActor,
		toActor,
		chainId,
		amount = 0n,
		tokenSymbol = 'USDC',
		tokenDecimals = 6,
		tokenAddress,
		mode = 'channel',
	}: {
		walletConnection: ConnectedWallet | null
		fromActor: `0x${string}`
		toActor: `0x${string}`
		chainId: number
		amount?: bigint
		tokenSymbol?: string
		tokenDecimals?: number
		tokenAddress: `0x${string}`
		mode?: 'direct' | 'channel'
	} = $props()

	// (Derived)
	const amountLabel = $derived(formatSmallestToDecimal(amount, tokenDecimals))
	const canTransfer = $derived(
		amount > 0n &&
			(mode === 'channel'
				? Boolean(yellowState.clearnodeConnection) &&
					yellowState.address?.toLowerCase() === fromActor.toLowerCase()
				: true),
	)

	// Actions
	const executeChannelTransfer = async () => {
		if (!yellowState.clearnodeConnection) {
			throw new Error('Connect to a Yellow clearnode to transfer.')
		}
		if (!yellowState.address) {
			throw new Error('Missing Yellow wallet address.')
		}
		if (yellowState.address.toLowerCase() !== fromActor.toLowerCase()) {
			throw new Error('Active Yellow address must match the transfer sender.')
		}
		await sendTransfer({
			clearnodeConnection: yellowState.clearnodeConnection,
			destination: toActor,
			allocations: [
				{
					asset: tokenSymbol.toLowerCase(),
					amount: amountLabel,
				},
			],
		})
	}
	const executeDirectTransfer = async (args: {
		provider: {
			request: (args: {
				method: string
				params?: unknown[]
			}) => Promise<unknown>
		}
		walletAddress: `0x${string}`
	}) => {
		if (args.walletAddress.toLowerCase() !== fromActor.toLowerCase()) {
			throw new Error('Active wallet address must match the transfer sender.')
		}
		const txHash = await args.provider.request({
			method: 'eth_sendTransaction',
			params: [
				{
					from: args.walletAddress,
					to: tokenAddress,
					data: encodeTransferCall(toActor, amount),
				},
			],
		})
		if (typeof txHash !== 'string') {
			throw new Error('Direct transfer did not return a transaction hash.')
		}
		const txId: Transaction$Id = {
			address: args.walletAddress,
			sourceTxHash: txHash,
			createdAt: Date.now(),
		}
		insertTransaction({
			$id: txId,
			fromChainId: chainId,
			toChainId: chainId,
			fromAmount: amount,
			toAmount: amount,
			destTxHash: txHash,
			status: 'pending',
		})
		updateTransaction(txId, { status: 'completed', destTxHash: txHash })
	}

	// Components
	import TransactionFlow from '$/components/TransactionFlow.svelte'
</script>

{#snippet transferSummary()}
	<div data-column="gap-1">
		<p data-muted>From: {fromActor.slice(0, 8)}…{fromActor.slice(-4)}</p>
		<p data-muted>To: {toActor.slice(0, 8)}…{toActor.slice(-4)}</p>
		<p data-muted>Amount: {amountLabel} {tokenSymbol}</p>
		<p data-muted>Mode: {mode}</p>
	</div>
{/snippet}

<TransactionFlow
	{walletConnection}
	Summary={transferSummary}
	transactions={[
		{
			id: `transfer-${chainId}-${fromActor}-${toActor}`,
			chainId,
			title: 'Transfer',
			actionLabel: 'Transfer',
			canExecute: canTransfer,
			execute: (args) =>
				mode === 'channel'
					? executeChannelTransfer()
					: executeDirectTransfer(args),
		},
	]}
/>
