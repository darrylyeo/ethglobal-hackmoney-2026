<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import type { Coin } from '$/constants/coins'
	import { CoinType } from '$/constants/coins'
	import { networksByChainId } from '$/constants/networks'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { Button } from 'bits-ui'
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

	type TransferSessionParams = {
		fromActor: `0x${string}`
		toActor: `0x${string}`
		chainId: number
		amount: bigint
		tokenSymbol: string
		tokenDecimals: number
		tokenAddress: `0x${string}`
		mode: 'direct' | 'channel'
	}

	const toBigInt = (value: unknown, fallback: bigint) => (
		typeof value === 'bigint' ?
			value
		: typeof value === 'number' && Number.isFinite(value) ?
			BigInt(Math.floor(value))
		: typeof value === 'string' && /^\d+$/.test(value) ?
			BigInt(value)
		: fallback
	)
	const toNumber = (value: unknown, fallback: number) => (
		typeof value === 'number' && Number.isFinite(value) ?
			value
		: typeof value === 'string' &&
			value.trim().length > 0 &&
			Number.isFinite(Number(value)) ?
			Number(value)
		: fallback
	)
	const toAddress = (value: unknown, fallback: `0x${string}`) => (
		typeof value === 'string' ? normalizeAddress(value) ?? fallback : fallback
	)
	const toMode = (value: unknown, fallback: 'direct' | 'channel') => (
		value === 'direct' || value === 'channel' ? value : fallback
	)
	const normalizeTransferParams = (
		params: Record<string, unknown> | null,
	): TransferSessionParams => ({
		fromActor: toAddress(params?.fromActor, fromActor),
		toActor: toAddress(params?.toActor, toActor),
		chainId: toNumber(params?.chainId, chainId),
		amount: toBigInt(params?.amount, amount),
		tokenSymbol:
			typeof params?.tokenSymbol === 'string' ? params.tokenSymbol : tokenSymbol,
		tokenDecimals: toNumber(params?.tokenDecimals, tokenDecimals),
		tokenAddress: toAddress(params?.tokenAddress, tokenAddress),
		mode: toMode(params?.mode, mode),
	})

	// (Derived)
	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, activeSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[activeSessionId],
	)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const sessionParams = $derived(
		normalizeTransferParams(session?.params ?? null),
	)
	const sessionLocked = $derived(Boolean(session?.lockedAt))
	const settings = $derived(sessionParams)
	const amountLabel = $derived(
		formatSmallestToDecimal(settings.amount, settings.tokenDecimals),
	)
	const chainLabel = $derived(
		networksByChainId[settings.chainId]?.name ?? `Chain ${settings.chainId}`,
	)
	const transferCoin = $derived<Coin>({
		type: CoinType.Erc20,
		chainId: settings.chainId,
		address: settings.tokenAddress,
		symbol: settings.tokenSymbol,
		decimals: settings.tokenDecimals,
	})
	const canTransfer = $derived(
		settings.amount > 0n &&
			(settings.mode === 'channel' ?
				Boolean(yellowState.clearnodeConnection) &&
					yellowState.address?.toLowerCase() ===
						settings.fromActor.toLowerCase()
			:
				true),
	)

	const activateSession = (sessionId: string) => {
		activeSessionId = sessionId
		if (typeof window === 'undefined') return
		const nextHash = buildSessionHash(sessionId)
		const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`
		history.replaceState(history.state, '', nextUrl)
	}
	const forkSession = () => {
		if (!session) return
		activateSession(
			createTransactionSession({
				flows: [...session.flows],
				params: sessionParams,
			}).id,
		)
	}

	$effect(() => {
		if (typeof window === 'undefined') return
		const handleHash = () => {
			const parsed = parseSessionHash(window.location.hash)
			if (parsed.kind === 'session') {
				if (parsed.sessionId === activeSessionId && session) return
				if (getTransactionSession(parsed.sessionId)) {
					activeSessionId = parsed.sessionId
					return
				}
				activateSession(
					createTransactionSession({
						flows: ['transfer'],
						params: normalizeTransferParams(null),
					}).id,
				)
				return
			}
			activateSession(
				createTransactionSession({
					flows: ['transfer'],
					params: normalizeTransferParams(
						parsed.kind === 'params' ? parsed.params : null,
					),
				}).id,
			)
		}
		handleHash()
		window.addEventListener('hashchange', handleHash)
		return () => window.removeEventListener('hashchange', handleHash)
	})

	// Functions
	import { encodeTransferCall } from '$/api/voltaire'
	import { sendTransfer } from '$/api/yellow'
	import { formatAddress, normalizeAddress } from '$/lib/address'
	import { formatSmallestToDecimal } from '$/lib/format'
	import {
		buildSessionHash,
		createTransactionSession,
		getTransactionSession,
		parseSessionHash,
	} from '$/lib/transaction-sessions'

	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'
	import {
		insertTransaction,
		updateTransaction,
	} from '$/collections/transactions'
	import type { Transaction$Id } from '$/data/Transaction'

	let activeSessionId = $state<string | null>(null)

	// Actions
	const executeChannelTransfer = async () => {
		if (!yellowState.clearnodeConnection) {
			throw new Error('Connect to a Yellow clearnode to transfer.')
		}
		if (!yellowState.address) {
			throw new Error('Missing Yellow wallet address.')
		}
		if (yellowState.address.toLowerCase() !== settings.fromActor.toLowerCase()) {
			throw new Error('Active Yellow address must match the transfer sender.')
		}
		await sendTransfer({
			clearnodeConnection: yellowState.clearnodeConnection,
			destination: settings.toActor,
			allocations: [
				{
					asset: settings.tokenSymbol.toLowerCase(),
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
		if (args.walletAddress.toLowerCase() !== settings.fromActor.toLowerCase()) {
			throw new Error('Active wallet address must match the transfer sender.')
		}
		const txHash = await args.provider.request({
			method: 'eth_sendTransaction',
			params: [
				{
					from: args.walletAddress,
					to: settings.tokenAddress,
					data: encodeTransferCall(settings.toActor, settings.amount),
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
			fromChainId: settings.chainId,
			toChainId: settings.chainId,
			fromAmount: settings.amount,
			toAmount: settings.amount,
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
		<dd>{formatAddress(settings.fromActor)}</dd>
		<dt>To</dt>
		<dd>{formatAddress(settings.toActor)}</dd>
		<dt>Network</dt>
		<dd>{chainLabel}</dd>
		<dt>Amount</dt>
		<dd>
			<CoinAmount
				coin={transferCoin}
				amount={settings.amount}
				draggable={false}
			/>
		</dd>
		<dt>Mode</dt>
		<dd>{settings.mode === 'channel' ? 'Channel (Yellow)' : 'Direct'}</dd>
	</dl>
{/snippet}

{#snippet transferDetails()}
	<dl class="summary">
		<dt>Token</dt>
		<dd>{settings.tokenSymbol} ({formatAddress(settings.tokenAddress)})</dd>
		<dt>Transfer amount</dt>
		<dd>{amountLabel} {settings.tokenSymbol}</dd>
	</dl>
	{#if settings.mode === 'channel' && !yellowState.clearnodeConnection}
		<p data-muted>Connect a Yellow clearnode to send.</p>
	{/if}
{/snippet}

{#if sessionLocked}
	<div data-row="gap-2 align-center">
		<Button.Root type="button" onclick={forkSession}>
			New draft
		</Button.Root>
	</div>
{/if}

<TransactionFlow
	{walletConnection}
	sessionId={session?.id ?? null}
	sessionParams={sessionParams}
	Summary={transferSummary}
	transactions={[
		{
			id: `transfer-${settings.chainId}-${settings.fromActor}-${settings.toActor}`,
			chainId: settings.chainId,
			title: 'Transfer',
			actionLabel: 'Transfer',
			canExecute: canTransfer,
			execute: (args) =>
				settings.mode === 'channel'
					? executeChannelTransfer()
					: executeDirectTransfer(args),
			Details: transferDetails,
		},
	]}
/>
