<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import type { Coin } from '$/schema/constants/coins'
	import { CoinType } from '$/constants/coins'
	import { networksByChainId } from '$/constants/networks'

	// Context
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
	const chainLabel = $derived(
		networksByChainId[chainId]?.name ?? `Chain ${chainId}`,
	)
	const transferCoin = $derived<Coin>({
		type: CoinType.Erc20,
		chainId,
		address: tokenAddress,
		symbol: tokenSymbol,
		decimals: tokenDecimals,
	})
	const canTransfer = $derived(
		amount > 0n &&
			(mode === 'channel' ?
				Boolean(yellowState.clearnodeConnection) &&
					yellowState.address?.toLowerCase() === fromActor.toLowerCase()
			:
				true),
	)

	// Functions
	import { encodeTransferCall } from '$/api/voltaire'
	import { sendTransfer } from '$/api/yellow'
	import { formatAddress } from '$/lib/address'
	import { formatSmallestToDecimal } from '$/lib/format'

	// State
	import {
		insertTransaction,
		updateTransaction,
	} from '$/collections/transactions'
	import type { Transaction$Id } from '$/data/Transaction'

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
	import CoinAmount from '$/views/CoinAmount.svelte'
	import TransactionFlow from '$/views/TransactionFlow.svelte'
</script>


{#snippet transferSummary()}
	<dl class="summary">
		<dt>From</dt>
		<dd>{formatAddress(fromActor)}</dd>
		<dt>To</dt>
		<dd>{formatAddress(toActor)}</dd>
		<dt>Network</dt>
		<dd>{chainLabel}</dd>
		<dt>Amount</dt>
		<dd>
			<CoinAmount coin={transferCoin} amount={amount} draggable={false} />
		</dd>
		<dt>Mode</dt>
		<dd>{mode === 'channel' ? 'Channel (Yellow)' : 'Direct'}</dd>
	</dl>
{/snippet}

{#snippet transferDetails()}
	<dl class="summary">
		<dt>Token</dt>
		<dd>{tokenSymbol} ({formatAddress(tokenAddress)})</dd>
		<dt>Transfer amount</dt>
		<dd>{amountLabel} {tokenSymbol}</dd>
	</dl>
	{#if mode === 'channel' && !yellowState.clearnodeConnection}
		<p data-muted>Connect a Yellow clearnode to send.</p>
	{/if}
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
			Details: transferDetails,
		},
	]}
/>
