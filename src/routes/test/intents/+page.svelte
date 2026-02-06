<script lang="ts">


	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import type { IntentDragPayload } from '$/lib/intents/types'
	import type {
		IntentRouteStep,
		IntentBridgeRouteOption,
	} from '$/lib/intents/routes'
	import type { BridgeRoute } from '$/data/BridgeRoute'
	import type { Transaction$Id } from '$/data/Transaction'
	import { EntityType } from '$/data/$EntityType'
	import { WalletConnectionTransport } from '$/data/WalletConnection'
	import { encodeTransferCall } from '$/api/voltaire'
	import { executeSelectedRoute } from '$/api/lifi'
	import { executeSwap } from '$/api/uniswap'
	import { sendTransfer } from '$/api/yellow'
	import { DataSource } from '$/constants/data-sources'
	import { networksByChainId } from '$/constants/networks'

	type IntentSessionParams = {
		from: IntentDragPayload | null
		to: IntentDragPayload | null
		routeId: string | null
	}


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'


	// Functions
	import { resolveIntent } from '$/lib/intents/resolve-intent'
	import { buildIntentRoutes } from '$/lib/intents/routes'
	import { getIntentDragPayload } from '$/lib/intents/drag'
	import {
		buildSessionHash,
		createTransactionSession,
		parseSessionHash,
		updateTransactionSessionParams,
	} from '$/lib/session/sessions'
	import {
		formatSmallestToDecimal,
		isValidDecimalInput,
		parseDecimalToSmallest,
	} from '$/lib/format'
	const resolveChainName = (chainId: number) =>
		Object.values(networksByChainId).find((entry) => entry?.id === chainId)
			?.name ?? `Chain ${chainId}`


	// State
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import { bridgeRoutesCollection } from '$/collections/bridge-routes'
	import { swapQuotesCollection } from '$/collections/swap-quotes'
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'
	import {
		insertTransaction,
		updateTransaction,
	} from '$/collections/transactions'
	import { yellowState } from '$/state/yellow.svelte'

	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let activeSessionId = $state<string | null>(null)
	let lookupSessionId = $state<string | null>(null)
	let transferAmountInput = $state('')

	const setPayload = (placement: 'from' | 'to', payload: IntentDragPayload) => {
		const next = {
			...payload,
			context: {
				...payload.context,
				placement,
			},
		}
		updateIntentParams({
			...sessionParams,
			from: placement === 'from' ? next : sessionParams.from,
			to: placement === 'to' ? next : sessionParams.to,
		})
	}

	const onDrop = (placement: 'from' | 'to') => (event: DragEvent) => {
		event.preventDefault()
		const payload = getIntentDragPayload(event)
		if (!payload) return
		setPayload(placement, payload)
	}

	const onDragOver = (event: DragEvent) => {
		event.preventDefault()
	}

	const isRecord = (value: unknown): value is Record<string, unknown> =>
		typeof value === 'object' && value !== null
	const isIntentDragPayload = (value: unknown): value is IntentDragPayload => {
		if (!isRecord(value)) return false
		const entity = value.entity
		if (!isRecord(entity)) return false
		return entity.type !== undefined && entity.id !== undefined
	}
	const normalizeIntentParams = (
		params: Record<string, unknown> | null,
	): IntentSessionParams => ({
		from: isIntentDragPayload(params?.from) ? (params?.from ?? null) : null,
		to: isIntentDragPayload(params?.to) ? (params?.to ?? null) : null,
		routeId: typeof params?.routeId === 'string' ? params.routeId : null,
	})
	const activateSession = (sessionId: string) => {
		activeSessionId = sessionId
		if (typeof window === 'undefined') return
		const nextHash = buildSessionHash(sessionId)
		const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`
		history.replaceState(history.state, '', nextUrl)
	}
	const updateIntentParams = (nextParams: IntentSessionParams) => {
		if (!session) return
		if (sessionLocked) {
			activateSession(
				createTransactionSession({
					actions: [...session.actions],
					params: nextParams,
				}).id,
			)
			return
		}
		updateTransactionSessionParams(session.id, nextParams)
	}


	// State
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
	const balancesQuery = useLiveQuery((q) =>
		q
			.from({ row: actorCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Voltaire))
			.select(({ row }) => ({ row })),
	)
	const swapQuotesQuery = useLiveQuery((q) =>
		q
			.from({ row: swapQuotesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Uniswap))
			.select(({ row }) => ({ row })),
	)
	const bridgeRoutesQuery = useLiveQuery((q) =>
		q
			.from({ row: bridgeRoutesCollection })
			.where(({ row }) => eq(row.$source, DataSource.LiFi))
			.select(({ row }) => ({ row })),
	)
	const liveQueryEntries = [
		{
			id: 'intents-session',
			label: 'Session',
			query: sessionQuery,
		},
		{
			id: 'intents-balances',
			label: 'Balances',
			query: balancesQuery,
		},
		{
			id: 'intents-swap-quotes',
			label: 'Swap Quotes',
			query: swapQuotesQuery,
		},
		{
			id: 'intents-bridge-routes',
			label: 'Bridge Routes',
			query: bridgeRoutesQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)


	// (Derived)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const sessionParams = $derived(normalizeIntentParams(session?.params ?? null))
	const sessionLocked = $derived(Boolean(session?.lockedAt))
	const fromPayload = $derived(sessionParams.from)
	const toPayload = $derived(sessionParams.to)
	const selectedRouteId = $derived(sessionParams.routeId)
	const actorCoins = $derived((balancesQuery.data ?? []).map((r) => r.row))
	const swapQuotes = $derived((swapQuotesQuery.data ?? []).map((r) => r.row))
	const bridgeRouteOptions = $derived<IntentBridgeRouteOption[]>(
		(bridgeRoutesQuery.data ?? []).flatMap((entry) =>
			entry.row.routes.map((route) => ({
				rowId: entry.row.$id,
				route,
			})),
		),
	)

	const selectedWallet = $derived(
		connectedWallets.find((w) => w.connection.selected) ?? null,
	)
	const walletRow = $derived(
		selectedWallet &&
			selectedWallet.connection.transport ===
				WalletConnectionTransport.Eip1193 &&
			'provider' in selectedWallet.wallet
			? selectedWallet.wallet
			: null,
	)

	const fromRef = $derived(fromPayload?.entity ?? null)
	const toRef = $derived(toPayload?.entity ?? null)

	const resolution = $derived(
		fromRef && toRef ? resolveIntent(fromRef, toRef) : null,
	)
	const routes = $derived(
		resolution
			? buildIntentRoutes(resolution, {
					swapQuotes,
					bridgeRoutes: bridgeRouteOptions,
				})
			: [],
	)
	const selectedRoute = $derived(
		routes.find((route) => route.id === selectedRouteId) ?? routes[0] ?? null,
	)
	const isTransferOnly = $derived(
		selectedRoute?.steps.length === 1 &&
			selectedRoute.steps[0]?.type === 'transfer',
	)
	const activeTransferStep = $derived(
		selectedRoute?.steps.find((step) => step.type === 'transfer') ?? null,
	)
	const transferCoin = $derived(
		activeTransferStep
			? (actorCoins.find(
					(row) =>
						row.$id.chainId === activeTransferStep.chainId &&
						row.$id.address.toLowerCase() ===
							activeTransferStep.fromActor.toLowerCase() &&
						row.$id.tokenAddress.toLowerCase() ===
							activeTransferStep.tokenAddress.toLowerCase(),
				) ?? null)
			: null,
	)
	const transferDecimals = $derived(transferCoin?.decimals ?? 6)
	const transferAmount = $derived(
		transferAmountInput &&
			isValidDecimalInput(transferAmountInput, transferDecimals)
			? parseDecimalToSmallest(transferAmountInput, transferDecimals)
			: 0n,
	)
	const transferTokenSymbol = $derived(transferCoin?.symbol ?? 'USDC')

	const executeSwapStep = async (
		step: Extract<IntentRouteStep, { type: 'swap' }>,
		{
			provider,
			walletAddress,
			onStatus,
		}: {
			provider: {
				request: (args: {
					method: string
					params?: unknown[]
				}) => Promise<unknown>
			}
			walletAddress: `0x${string}`
			onStatus: (u: {
				status: 'signing' | 'executing' | 'confirming' | 'completed' | 'failed'
				error?: string
				txHash?: `0x${string}`
			}) => void
		},
	) => {
		onStatus({ status: 'executing' })
		const deadline = Math.floor(Date.now() / 1000) + 1200
		const result = await executeSwap({
			provider,
			quote: step.quote,
			recipient: walletAddress,
			deadline,
		})
		const txId: Transaction$Id = {
			address: walletAddress,
			sourceTxHash: result.txHash,
			createdAt: Date.now(),
		}
		insertTransaction({
			$id: txId,
			fromChainId: step.quote.chainId,
			toChainId: step.quote.chainId,
			fromAmount: step.quote.amountIn,
			toAmount: step.quote.amountOut,
			destTxHash: result.txHash,
			status: 'pending',
		})
		updateTransaction(txId, { status: 'completed', destTxHash: result.txHash })
		return { txHash: result.txHash }
	}

	const executeBridgeStep = async (
		step: Extract<IntentRouteStep, { type: 'bridge'; route: BridgeRoute }>,
		{
			walletAddress,
			onStatus,
		}: {
			walletAddress: `0x${string}`
			onStatus: (u: {
				status: 'signing' | 'executing' | 'confirming' | 'completed' | 'failed'
				error?: string
				txHash?: `0x${string}`
			}) => void
		},
	) => {
		if (!walletRow) throw new Error('Connect a signing wallet to bridge.')
		if (walletAddress.toLowerCase() !== step.actor.toLowerCase()) {
			throw new Error('Active wallet address must match the bridge actor.')
		}
		onStatus({ status: 'executing' })
		let txId: Transaction$Id | null = null
		let sourceTxHash: string | null = null
		const result = await executeSelectedRoute(
			{
				info: {
					uuid: walletRow.$id.rdns,
					name: walletRow.name,
					icon: walletRow.icon,
					rdns: walletRow.rdns,
				},
				provider: walletRow.provider,
			},
			step.route,
			(status) => {
				const hash = status.steps.find((s) => s.txHash)?.txHash
				if (hash && !txId) {
					sourceTxHash = hash
					txId = {
						address: walletAddress,
						sourceTxHash: hash,
						createdAt: Date.now(),
					}
					insertTransaction({
						$id: txId,
						fromChainId: step.route.fromChainId,
						toChainId: step.route.toChainId,
						fromAmount: step.route.fromAmount,
						toAmount: step.route.toAmount,
						destTxHash: null,
						status: 'pending',
					})
				}
			},
		)
		const processEntries = result.steps.flatMap((s) =>
			Array.isArray(s.execution?.process) ? s.execution?.process : [],
		)
		const destHash =
			processEntries
				.map((entry) =>
					entry && typeof entry === 'object'
						? {
								chainId:
									typeof entry.chainId === 'number' ? entry.chainId : null,
								txHash: typeof entry.txHash === 'string' ? entry.txHash : null,
							}
						: { chainId: null, txHash: null },
				)
				.find((entry) => entry.chainId === step.route.toChainId)?.txHash ?? null
		if (txId) {
			updateTransaction(txId, { status: 'completed', destTxHash: destHash })
		}
		return { txHash: sourceTxHash ?? undefined }
	}

	const executeChannelTransferStep = async (
		step: Extract<IntentRouteStep, { type: 'transfer' }>,
	) => {
		if (!yellowState.clearnodeConnection) {
			throw new Error('Connect to a Yellow clearnode to transfer.')
		}
		if (!yellowState.address) {
			throw new Error('Missing Yellow wallet address.')
		}
		if (yellowState.address.toLowerCase() !== step.fromActor.toLowerCase()) {
			throw new Error('Active Yellow address must match the transfer sender.')
		}
		if (!transferAmountInput.trim()) {
			throw new Error('Enter a transfer amount.')
		}
		await sendTransfer({
			clearnodeConnection: yellowState.clearnodeConnection,
			destination: step.toActor,
			allocations: [
				{
					asset: transferTokenSymbol.toLowerCase(),
					amount: transferAmountInput.trim(),
				},
			],
		})
	}
	const executeDirectTransferStep = async (
		step: Extract<IntentRouteStep, { type: 'transfer' }>,
		args: {
			provider: {
				request: (args: {
					method: string
					params?: unknown[]
				}) => Promise<unknown>
			}
			walletAddress: `0x${string}`
		},
	) => {
		if (args.walletAddress.toLowerCase() !== step.fromActor.toLowerCase()) {
			throw new Error('Active wallet address must match the transfer sender.')
		}
		const txHash = await args.provider.request({
			method: 'eth_sendTransaction',
			params: [
				{
					from: args.walletAddress,
					to: step.tokenAddress,
					data: encodeTransferCall(step.toActor, transferAmount),
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
			fromChainId: step.chainId,
			toChainId: step.chainId,
			fromAmount: transferAmount,
			toAmount: transferAmount,
			destTxHash: txHash,
			status: 'pending',
		})
		updateTransaction(txId, { status: 'completed', destTxHash: txHash })
	}

	const toTransaction = (step: IntentRouteStep) => {
		const chainId = step.type === 'bridge' ? step.fromChainId : step.chainId
		const title =
			step.type === 'swap'
				? 'Swap'
				: step.type === 'bridge'
					? 'Bridge'
					: `Transfer (${step.mode})`
		const actionLabel =
			step.type === 'swap'
				? 'Swap'
				: step.type === 'bridge'
					? 'Bridge'
					: 'Transfer'
		const canExecute =
			step.type === 'transfer'
				? transferAmount > 0n &&
					(step.mode === 'channel'
						? Boolean(yellowState.clearnodeConnection)
						: true)
				: true
		return {
			id: step.id,
			chainId,
			title,
			actionLabel,
			canExecute,
			step,
			execute: (args: {
				provider: {
					request: (args: {
						method: string
						params?: unknown[]
					}) => Promise<unknown>
				}
				walletAddress: `0x${string}`
				onStatus: (u: {
					status:
						| 'signing'
						| 'executing'
						| 'confirming'
						| 'completed'
						| 'failed'
					error?: string
					txHash?: `0x${string}`
				}) => void
			}) =>
				step.type === 'swap'
					? executeSwapStep(step, args)
					: step.type === 'bridge' && 'route' in step
						? executeBridgeStep(step, {
								walletAddress: args.walletAddress,
								onStatus: args.onStatus,
							})
						: step.type === 'bridge' &&
								'protocol' in step &&
								step.protocol === 'gateway'
							? Promise.resolve({ txHash: undefined })
							: step.type === 'transfer'
								? step.mode === 'channel'
									? executeChannelTransferStep(step)
									: executeDirectTransferStep(step, args)
								: Promise.resolve({ txHash: undefined }),
		}
	}

	const transactions = $derived(
		selectedRoute ? selectedRoute.steps.map(toTransaction) : [],
	)

	$effect(() => {
		if (!lookupSessionId || !lookupSessionQuery.isReady) return
		if (lookupSession) {
			activeSessionId = lookupSessionId
		} else {
			activateSession(
				createTransactionSession({
					actions: ['intent'],
					params: normalizeIntentParams(null),
				}).id,
			)
			lookupSessionId = null
		}
	})
	$effect(() => {
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
							: ['intent'],
					params: normalizeIntentParams(
						parsed.kind === 'actions'
							? (parsed.actions[0]?.params ?? null)
							: null,
					),
				}).id,
			)
		}
		handleHash()
		window.addEventListener('hashchange', handleHash)
		return () => window.removeEventListener('hashchange', handleHash)
	})

	$effect(() => {
		if (!session) return
		const intendedRouteId = routes[0]?.id ?? null
		const currentInvalid =
			!selectedRouteId || !routes.some((route) => route.id === selectedRouteId)
		if (currentInvalid && sessionParams.routeId !== intendedRouteId) {
			updateIntentParams({
				...sessionParams,
				routeId: intendedRouteId,
			})
		}
	})


	// Components
	import AccountsSelect from '$/views/AccountsSelect.svelte'
	import EntityId from '$/components/EntityId.svelte'
	import TransactionFlow from '$/views/TransactionFlow.svelte'
	import TransferFlow from '$/routes/session/TransferFlow.svelte'
</script>


<main
	id="main"
	data-column="gap-6"
	data-sticky-container
>
	<section data-scroll-item data-column="gap-3">
		<h1>Entity intents</h1>
		<p data-muted>Drag balances into from/to slots to resolve intents.</p>
	</section>

	<section data-scroll-item data-column="gap-3">
		<h2>Wallet context</h2>
		<AccountsSelect bind:connectedWallets bind:selectedActor />
	</section>

	<section data-scroll-item data-column="gap-3">
		<h2>Intent slots</h2>
		<div data-row="gap-3 wrap">
			<div
				class="intent-slot"
				data-card="padding-4"
				ondrop={onDrop('from')}
				ondragover={onDragOver}
				role="button"
				tabindex="0"
			>
				<strong>From</strong>
				{#if fromPayload}
					<pre data-muted>{JSON.stringify(fromPayload, null, 2)}</pre>
				{:else}
					<p data-muted>Drop an entity</p>
				{/if}
			</div>
			<div
				class="intent-slot"
				data-card="padding-4"
				ondrop={onDrop('to')}
				ondragover={onDragOver}
				role="button"
				tabindex="0"
			>
				<strong>To</strong>
				{#if toPayload}
					<pre data-muted>{JSON.stringify(toPayload, null, 2)}</pre>
				{:else}
					<p data-muted>Drop an entity</p>
				{/if}
			</div>
		</div>
	</section>

	<section data-scroll-item data-column="gap-3">
		<h2>Balances (TanStack DB cache)</h2>
		{#if actorCoins.length === 0}
			<p data-muted>No cached balances yet.</p>
		{:else}
			<div data-column="gap-2">
				{#each actorCoins as row (row.$id.chainId + row.$id.address + row.$id.tokenAddress)}
					{@const intent = {
						entity: {
							type: EntityType.ActorCoin,
							id: row.$id,
						},
						context: {
							source: 'intent-test',
						},
					}}
					<div data-row="gap-2 align-center">
						<EntityId
							className="intent-entity"
							draggableText={`${row.symbol} ${row.$id.address}`}
							{intent}
						>
							<span>
								{row.symbol} · {resolveChainName(row.$id.chainId)}
								· {row.$id.address.slice(0, 8)}…{row.$id.address.slice(-4)}
								· {formatSmallestToDecimal(row.balance, row.decimals, 4)}
							</span>
						</EntityId>
						<button
							type="button"
							onclick={() =>
								setPayload('from', {
									...intent,
									context: { ...intent.context, placement: 'from' },
								})}
						>
							From
						</button>
						<button
							type="button"
							onclick={() =>
								setPayload('to', {
									...intent,
									context: { ...intent.context, placement: 'to' },
								})}
						>
							To
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<section data-scroll-item data-column="gap-3">
		<h2>Resolved intent</h2>
		{#if resolution}
			<pre data-muted>{JSON.stringify(resolution, null, 2)}</pre>
		{:else}
			<p data-muted>Select two entities.</p>
		{/if}
	</section>

	<section data-scroll-item data-column="gap-3">
		<h2>Routes</h2>
		{#if routes.length === 0}
			<p data-muted>No routes computed.</p>
		{:else}
			<div data-column="gap-2">
				{#each routes as route (route.id)}
					<label data-row="gap-2 align-center">
						<input
							type="radio"
							name="intent-route"
							value={route.id}
							checked={route.id === selectedRouteId}
							onchange={() => {
								updateIntentParams({
									...sessionParams,
									routeId: route.id,
								})
							}}
						/>
						<span>{route.label}</span>
					</label>
				{/each}
			</div>
		{/if}
	</section>

	{#if selectedRoute}
		<section data-scroll-item data-column="gap-3">
			<h2>Selected route preview</h2>
			<ol data-column="gap-1">
				{#each selectedRoute.steps as step (step.id)}
					<li>
						{#if step.type === 'swap'}
							Swap {step.quote.tokenIn.slice(0, 6)}… → {step.quote.tokenOut.slice(
								0,
								6,
							)}… on {resolveChainName(step.chainId)}
						{:else if step.type === 'bridge'}
							Bridge
							{'protocol' in step && step.protocol === 'gateway'
								? ' (Gateway)'
								: ''}
							{step.fromChainId} → {step.toChainId}
						{:else}
							Transfer ({step.mode}) {step.fromActor.slice(0, 6)}… → {step.toActor.slice(
								0,
								6,
							)}…
						{/if}
					</li>
				{/each}
			</ol>
		</section>

		<section data-scroll-item data-column="gap-3">
			<h2>Execute</h2>
			<div data-column="gap-2">
				<label data-row="gap-2 align-center">
					<span>Transfer amount</span>
					<input
						type="text"
						inputmode="decimal"
						placeholder="0.00"
						bind:value={transferAmountInput}
					/>
				</label>
				{#if isTransferOnly && selectedRoute.steps[0]?.type === 'transfer'}
					<TransferFlow
						walletConnection={selectedWallet}
						fromActor={selectedRoute.steps[0].fromActor}
						toActor={selectedRoute.steps[0].toActor}
						chainId={selectedRoute.steps[0].chainId}
						amount={transferAmount}
						tokenSymbol={transferTokenSymbol}
						tokenDecimals={transferDecimals}
						tokenAddress={selectedRoute.steps[0].tokenAddress}
						mode={selectedRoute.steps[0].mode}
					/>
				{:else}
					<TransactionFlow walletConnection={selectedWallet} {transactions} />
				{/if}
			</div>
		</section>
	{/if}
</main>


<style>
	.intent-slot {
		min-height: 140px;
		border: 1px dashed var(--color-border);
	}

	:global(.intent-entity) {
		cursor: grab;
	}

	:global(.intent-entity:active) {
		cursor: grabbing;
	}
</style>
