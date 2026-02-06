<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import type { Coin } from '$/constants/coins'
	import { CoinType } from '$/constants/coins'
	import { networksByChainId } from '$/constants/networks'
	import type { TransferSessionParams } from '$/lib/session/params'


	// Context
	import { getContext } from 'svelte'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'
	import { yellowState } from '$/state/yellow.svelte'
	import {
		getEffectiveHash,
		setEffectiveHash,
		SESSION_HASH_SOURCE_KEY,
	} from '$/lib/session/panel-hash'


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

	type ExecutionArgs = {
		provider: {
			request: (args: {
				method: string
				params?: unknown[]
			}) => Promise<unknown>
		}
		walletAddress: `0x${string}`
		mode: 'wallet' | 'e2e'
	}
	const isHexString = (value: unknown): value is `0x${string}` =>
		typeof value === 'string' && value.startsWith('0x')

	let activeSessionId = $state<string | null>(null)
	let lookupSessionId = $state<string | null>(null)


	// (Derived)
	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, activeSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[() => activeSessionId],
	)
	const lookupSessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, lookupSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[() => lookupSessionId],
	)
	const lookupSession = $derived(lookupSessionQuery.data?.[0]?.row ?? null)
	const liveQueryEntries = [
		{
			id: 'transfer-flow-session',
			label: 'Session',
			query: sessionQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const transferDefaults = $derived({
		fromActor,
		toActor,
		chainId,
		amount,
		tokenSymbol,
		tokenDecimals,
		tokenAddress,
		mode,
	} satisfies TransferSessionParams)
	const sessionParams = $derived(
		getTransferSessionParams(session, transferDefaults),
	)
	const sessionLocked = $derived(Boolean(session?.lockedAt))
	const settings = $derived(sessionParams)
	const hashSource = getContext<
		import('$/lib/session/panel-hash').SessionHashSource
	>(SESSION_HASH_SOURCE_KEY)
	const effectiveHash = $derived(getEffectiveHash(hashSource))
	const amountLabel = $derived(
		formatSmallestToDecimal(settings.amount, settings.tokenDecimals),
	)
	const chainLabel = $derived(
		Object.values(networksByChainId).find(
			(entry) => entry?.id === settings.chainId,
		)?.name ?? `Chain ${settings.chainId}`,
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
			(settings.mode === 'channel'
				? Boolean(yellowState.clearnodeConnection) &&
					yellowState.address?.toLowerCase() ===
						settings.fromActor.toLowerCase()
				: true),
	)

	const activateSession = (sessionId: string) => {
		activeSessionId = sessionId
		setEffectiveHash(hashSource, buildSessionHash(sessionId))
	}
	const forkSession = () => {
		if (!session) return
		activateSession(
			createTransactionSession({
				actions: [...session.actions],
				params: sessionParams,
			}).id,
		)
	}

	$effect(() => {
		if (!lookupSessionId || !lookupSessionQuery.isReady) return
		if (lookupSession) {
			activeSessionId = lookupSessionId
		} else {
			activateSession(
				createTransactionSession({
					actions: ['transfer'],
					params: transferDefaults,
					defaults: { transfer: transferDefaults },
				}).id,
			)
			lookupSessionId = null
		}
	})
	$effect(() => {
		const hash = hashSource.enabled
			? effectiveHash
			: typeof window !== 'undefined'
				? window.location.hash
				: ''
		const parsed = parseSessionHash(hash)
		if (parsed.kind === 'session') {
			lookupSessionId = parsed.sessionId
			return
		}
		lookupSessionId = null
		activateSession(
			createTransactionSession({
				actions:
					parsed.kind === 'actions'
						? parsed.actions.map((action) => action.action)
						: ['transfer'],
				params:
					parsed.kind === 'actions'
						? (parsed.actions[0]?.params ?? transferDefaults)
						: transferDefaults,
				defaults: { transfer: transferDefaults },
			}).id,
		)
	})
	$effect(() => {
		if (hashSource.enabled) return
		if (typeof window === 'undefined') return
		const handleHash = () => {
			const parsed = parseSessionHash(window.location.hash)
			if (parsed.kind === 'session') {
				lookupSessionId = parsed.sessionId
				return
			}
			lookupSessionId = null
			activateSession(
				createTransactionSession({
					actions:
						parsed.kind === 'actions'
							? parsed.actions.map((action) => action.action)
							: ['transfer'],
					params:
						parsed.kind === 'actions'
							? (parsed.actions[0]?.params ?? transferDefaults)
							: transferDefaults,
					defaults: { transfer: transferDefaults },
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
	import { requestE2eTevmValueTransfer } from '$/lib/e2e/tevm'
	import { formatSmallestToDecimal } from '$/lib/format'
	import { getTransferSessionParams } from '$/lib/session/params'
	import {
		buildSessionHash,
		createTransactionSession,
		parseSessionHash,
	} from '$/lib/session/sessions'


	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'
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
		if (
			yellowState.address.toLowerCase() !== settings.fromActor.toLowerCase()
		) {
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
	const executeDirectTransfer = async (args: ExecutionArgs) => {
		if (args.walletAddress.toLowerCase() !== settings.fromActor.toLowerCase()) {
			throw new Error('Active wallet address must match the transfer sender.')
		}
		const txHash =
			args.mode === 'e2e'
				? await requestE2eTevmValueTransfer({
						provider: args.provider,
						from: args.walletAddress,
						to: settings.toActor,
						value: settings.amount,
					})
				: await args.provider.request({
						method: 'eth_sendTransaction',
						params: [
							{
								from: args.walletAddress,
								to: settings.tokenAddress,
								data: encodeTransferCall(settings.toActor, settings.amount),
							},
						],
					})
		if (!isHexString(txHash)) {
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
		return { txHash }
	}


	// Components
	import Address from '$/components/Address.svelte'
	import LoadingButton from '$/components/LoadingButton.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import CoinAmount from '$/views/CoinAmount.svelte'
	import TransactionFlow from '$/views/TransactionFlow.svelte'
</script>

{#snippet transferSummary()}
	<dl class="summary">
		<dt>From</dt>
		<dd data-intent-transition="source">
			<Address network={settings.chainId} address={settings.fromActor} />
		</dd>
		<dt>To</dt>
		<dd data-intent-transition="target">
			<Address network={settings.chainId} address={settings.toActor} />
		</dd>
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
		<dd>{settings.tokenSymbol} (<TruncatedValue value={settings.tokenAddress} />)</dd>
		<dt>Transfer amount</dt>
		<dd>{amountLabel} {settings.tokenSymbol}</dd>
	</dl>
	{#if settings.mode === 'channel' && !yellowState.clearnodeConnection}
		<p data-muted>Connect a Yellow clearnode to send.</p>
	{/if}
{/snippet}

{#if sessionLocked}
	<div data-row="gap-2 align-center">
		<LoadingButton type="button" onclick={forkSession}>New draft</LoadingButton>
	</div>
{/if}

<TransactionFlow
	{walletConnection}
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
