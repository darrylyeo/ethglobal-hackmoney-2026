<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import type { Coin } from '$/constants/coins.ts'
	import type { Transaction$Id } from '$/data/Transaction.ts'
	import type { TransferSessionParams } from '$/lib/session/params.ts'
	import { encodeTransferCall } from '$/api/voltaire.ts'
	import { sendTransfer } from '$/api/yellow.ts'
	import { ActionType } from '$/constants/intents.ts'
	import { CoinType } from '$/constants/coins.ts'
	import { networksByChainId } from '$/constants/networks.ts'

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


	// Context
	import { page } from '$app/state'
	import { getContext } from 'svelte'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { yellowState } from '$/state/yellow.svelte.ts'
	import {
		getEffectiveHash,
		setEffectiveHash,
		SESSION_HASH_SOURCE_KEY,
	} from '$/lib/session/panelHash.ts'


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
		params = $bindable(),
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
		params?: Record<string, unknown>,
	} = $props()


	// Functions
	import { requestE2eTevmValueTransfer } from '$/tests/tevm.ts'
	import { formatSmallestToDecimal } from '$/lib/format.ts'
	import { stringify } from '$/lib/stringify.ts'
	import { normalizeTransferSessionParams } from '$/lib/session/params.ts'
	import {
		buildSessionHash,
		createSessionId,
		createTransactionSessionSimulation,
		createTransactionSessionWithId,
		parseSessionHash,
		updateTransactionSession,
	} from '$/lib/session/sessions.ts'

	const isHexString = (value: unknown): value is `0x${string}` =>
		typeof value === 'string' && value.startsWith('0x')
	const normalizeTransferParams = (
		params: Record<string, unknown> | null,
		defaults: TransferSessionParams,
	): TransferSessionParams => normalizeTransferSessionParams(params, defaults)


	// State
	import { transactionSessionsCollection } from '$/collections/TransactionSessions.ts'
	import {
		insertTransaction,
		updateTransaction,
	} from '$/collections/Transactions.ts'


	// Components
	import Address from '$/components/Address.svelte'
	import LoadingButton from '$/components/LoadingButton.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import CoinAmount from '$/views/CoinAmount.svelte'
	import TransactionFlow from '$/views/TransactionFlow.svelte'

	let activeSessionId = $state<string | null>(null)
	let pendingSessionId = $state<string | null>(null)
	let localParams = $state<TransferSessionParams | null>(null)
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
			id: 'transfer-action-session',
			label: 'Session',
			query: sessionQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const sessionLocked = $derived(Boolean(session?.lockedAt))
	const transferDefaults = $derived<TransferSessionParams>({
		fromActor,
		toActor,
		chainId,
		amount,
		tokenSymbol,
		tokenDecimals,
		tokenAddress,
		mode,
	})
	const settings = $derived(localParams ?? transferDefaults)
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
	const hashSource = getContext<
		import('$/lib/session/panelHash.ts').SessionHashSource
	>(SESSION_HASH_SOURCE_KEY)
	const effectiveHash = $derived(getEffectiveHash(hashSource, page.url.hash))


	// Actions
	const setLocalParamsIfChanged = (next: TransferSessionParams) => {
		if (localParams && stringify(localParams) === stringify(next)) return
		localParams = next
	}
	const setActiveSessionId = (next: string | null) => {
		if (activeSessionId === next) return
		activeSessionId = next
	}
	const setPendingSessionId = (next: string | null) => {
		if (pendingSessionId === next) return
		pendingSessionId = next
	}
	const setSessionHash = (sessionId: string) => {
		activeSessionId = sessionId
		pendingSessionId = null
		setEffectiveHash(hashSource, buildSessionHash(sessionId))
	}
	const persistDraft = () => {
		const nextParams = normalizeTransferParams(settings, settings)
		const current = session
		const shouldCreate = !current || current.lockedAt
		const sessionId = shouldCreate
			? (pendingSessionId ?? createSessionId())
			: current.id
		if (shouldCreate) {
			createTransactionSessionWithId(sessionId, {
				actions: [ActionType.Transfer],
				params: nextParams,
				defaults: {
					transfer: nextParams,
				},
			})
		} else {
			updateTransactionSession(sessionId, (session) => ({
				...session,
				params: nextParams,
				updatedAt: Date.now(),
			}))
		}
		setSessionHash(sessionId)
	}
	const persistSimulation = (result: unknown) => {
		const nextParams = normalizeTransferParams(settings, settings)
		const current = session
		const shouldCreate = !current || current.lockedAt
		const sessionId = shouldCreate
			? (pendingSessionId ?? createSessionId())
			: current.id
		if (shouldCreate) {
			createTransactionSessionWithId(sessionId, {
				actions: [ActionType.Transfer],
				params: nextParams,
				defaults: {
					transfer: nextParams,
				},
			})
		}
		updateTransactionSession(sessionId, (session) => ({
			...session,
			params: nextParams,
			lockedAt: session.lockedAt ?? Date.now(),
			updatedAt: Date.now(),
		}))
		const simulationId = createTransactionSessionSimulation({
			sessionId,
			params: nextParams,
			status: 'success',
			result,
		})
		updateTransactionSession(sessionId, (session) => ({
			...session,
			latestSimulationId: simulationId,
			simulationCount: (session.simulationCount ?? 0) + 1,
			updatedAt: Date.now(),
		}))
		setSessionHash(sessionId)
	}
	const persistExecution = (txHash?: `0x${string}`) => {
		const nextParams = normalizeTransferParams(settings, settings)
		const current = session
		const shouldCreate = !current || current.lockedAt
		const sessionId = shouldCreate
			? (pendingSessionId ?? createSessionId())
			: current.id
		if (shouldCreate) {
			createTransactionSessionWithId(sessionId, {
				actions: [ActionType.Transfer],
				params: nextParams,
				defaults: {
					transfer: nextParams,
				},
			})
		}
		updateTransactionSession(sessionId, (session) => ({
			...session,
			params: nextParams,
			status: 'Finalized',
			lockedAt: session.lockedAt ?? Date.now(),
			execution: {
				submittedAt: session.execution?.submittedAt ?? Date.now(),
				chainId: settings.chainId,
				txHash: txHash ?? session.execution?.txHash,
			},
			finalization: {
				at: Date.now(),
			},
			updatedAt: Date.now(),
		}))
		setSessionHash(sessionId)
	}

	$effect(() => {
		if (!localParams)
			setLocalParamsIfChanged(normalizeTransferParams(null, transferDefaults))
		const parsed = parseSessionHash(effectiveHash)
		if (parsed.kind === 'session') {
			lookupSessionId = parsed.sessionId
			return
		}
		lookupSessionId = null
		setActiveSessionId(null)
		setPendingSessionId(null)
		setLocalParamsIfChanged(
			normalizeTransferParams(
				parsed.kind === 'actions' ? (parsed.actions[0]?.params ?? null) : null,
				transferDefaults,
			),
		)
	})
	$effect(() => {
		if (!lookupSessionId || !lookupSessionQuery.isReady) return
		const existing = lookupSession
		if (existing) {
			setActiveSessionId(lookupSessionId)
			setPendingSessionId(null)
			setLocalParamsIfChanged(
				normalizeTransferParams(existing.params ?? null, transferDefaults),
			)
		} else {
			setActiveSessionId(null)
			setPendingSessionId(lookupSessionId)
			setLocalParamsIfChanged(normalizeTransferParams(null, transferDefaults))
		}
	})
	const executeChannelTransfer = async () => {
		if (!yellowState.clearnodeConnection) {
			throw new Error('Connect a Yellow clearnode to transfer.')
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

	const onSubmit = (event: SubmitEvent) => {
		event.preventDefault()
		const form = event.currentTarget
		if (!(form instanceof HTMLFormElement)) return
		const intent = new FormData(form).get('intent')
		if (intent === 'save') persistDraft()
	}
</script>


<form
	data-session-action
	data-card
	data-column="gap-3"
	onsubmit={onSubmit}
>
	<header data-row="gap-2 align-center justify-between">
		<div data-column="gap-1">
			<h2>Transfer</h2>
			{#if sessionLocked}
				<p data-muted>Last saved session is locked.</p>
			{/if}
		</div>
	</header>

	<div data-grid="columns-autofit column-min-16 gap-6">
		<section data-card data-column="gap-3">
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
		</section>

		<section data-card data-column="gap-3">
		<dl class="summary">
			<dt>Token</dt>
			<dd>{settings.tokenSymbol} (<TruncatedValue value={settings.tokenAddress} />)</dd>
			<dt>Transfer amount</dt>
			<dd>{amountLabel} {settings.tokenSymbol}</dd>
		</dl>
		{#if settings.mode === 'channel' && !yellowState.clearnodeConnection}
			<p data-muted>Connect a Yellow clearnode to send.</p>
		{/if}
		</section>

		<section data-card data-column="gap-3">
		<div data-row="gap-2 align-center wrap">
			<LoadingButton type="submit" name="intent" value="save">
				Save Draft
			</LoadingButton>
		</div>

		<TransactionFlow
			{walletConnection}
			onSimulationSuccess={({ result }) => persistSimulation(result)}
			onExecutionSuccess={({ txHash }) => persistExecution(txHash)}
			transactions={[
				{
					id: `transfer-${settings.chainId}-${settings.fromActor}-${settings.toActor}`,
					chainId: settings.chainId,
					title: 'Transfer',
					actionLabel: 'Sign and Submit',
					canExecute: canTransfer,
					simulate: async () => ({
						...settings,
					}),
					execute: (args) =>
						settings.mode === 'channel'
							? executeChannelTransfer()
							: executeDirectTransfer(args),
				},
			]}
		/>
		</section>
	</div>
</form>
