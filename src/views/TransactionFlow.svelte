<script lang="ts">
	// Types/constants
	import type { VoltaireProvider } from '$/api/voltaire'
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import type {
		ExplainAvailability,
		ExplainContext,
		ExplainRecord,
	} from '$/lib/explain'
	import type { EIP1193Provider } from '$/lib/wallet'
	import type { Snippet } from 'svelte'
	import { networksByChainId } from '$/constants/networks'
	import { rpcUrls } from '$/constants/rpc-endpoints'
	import { WalletConnectionTransport } from '$/data/WalletConnection'
	import { E2E_TEVM_ENABLED } from '$/lib/e2e/tevm'
	import { E2E_TEVM_WALLET_ADDRESS } from '$/lib/e2e/tevm-config'

	type ExecutionStatus =
		| 'idle'
		| 'signing'
		| 'executing'
		| 'confirming'
		| 'completed'
		| 'failed'
	type SimulationStatus = 'idle' | 'running' | 'success' | 'failed'
	type TransactionFlowExecutionUpdate = {
		status: ExecutionStatus
		error?: string
		txHash?: `0x${string}`
	}
	type TransactionFlowExecutionMode = 'wallet' | 'e2e'
	type TransactionFlowExecutionArgs = {
		mode: TransactionFlowExecutionMode
		provider: EIP1193Provider
		walletAddress: `0x${string}`
		onStatus: (update: TransactionFlowExecutionUpdate) => void
	}
	type ExplainTarget = 'simulation' | 'execution'
	type ExplainState = {
		status: 'idle' | 'loading' | 'success' | 'error'
		error: string | null
		progress: number | null
		record: ExplainRecord | null
		cancel?: () => void
	}
	type ExplainDetails = {
		summary?: string
		gasUsed?: string
		gasEstimated?: string
		revertReason?: string
		errorSelector?: string
		traceSummary?: string
		eventSummary?: string
	}
	type TransactionFlowItemState = {
		simulation: {
			status: SimulationStatus
			error: string | null
			result: unknown | null
		}
		execution: {
			status: ExecutionStatus
			error: string | null
			txHash: `0x${string}` | null
		}
		explanations: {
			simulation: ExplainState
			execution: ExplainState
		}
		confirmed: boolean
	}
	type TransactionFlowItemBase = {
		id: string
		chainId: number
		title: string
		actionLabel: string
		canExecute: boolean
		executionModes?: TransactionFlowExecutionMode[]
		simulate?: (args: {
			provider: VoltaireProvider
			walletAddress: `0x${string}`
		}) => Promise<unknown>
		execute?: (
			args: TransactionFlowExecutionArgs,
		) => Promise<{ txHash?: `0x${string}` } | void>
		requiresConfirmation?: boolean
		confirmationLabel?: string
	}
	type TransactionFlowItem = TransactionFlowItemBase & {
		Details?: Snippet<
			[item: TransactionFlowItemBase, state: TransactionFlowItemState]
		>
		Confirmation?: Snippet<
			[item: TransactionFlowItemBase, state: TransactionFlowItemState]
		>
	}

	// Context
	import { Button, Checkbox } from 'bits-ui'

	// Functions
	import { createHttpProvider } from '$/api/voltaire'
	import { createExplainProvider, createExplainRecord } from '$/lib/explain'
	import {
		createTransactionSessionSimulation,
		lockTransactionSession,
		markTransactionSessionFinalized,
		markTransactionSessionSubmitted,
		updateTransactionSession,
	} from '$/lib/transaction-sessions'
	import { getE2eProvider, switchWalletChain } from '$/lib/wallet'

	// Props
	let {
		walletConnection,
		Summary,
		transactions,
		sessionId,
		sessionParams,
	}: {
		walletConnection: ConnectedWallet | null
		Summary?: Snippet
		transactions: TransactionFlowItem[]
		sessionId?: string | null
		sessionParams?: Record<string, unknown> | null
	} = $props()

	// (Derived)
	const walletProvider = $derived(
		walletConnection &&
		walletConnection.connection.transport === WalletConnectionTransport.Eip1193 &&
		'provider' in walletConnection.wallet ?
			walletConnection.wallet.provider
		: null,
	)
	const walletAddress = $derived(
		walletConnection?.connection.activeActor ?? null,
	)
	const e2eProvider = $derived(
		E2E_TEVM_ENABLED ? getE2eProvider() : null,
	)

	// Functions
	const isRecord = (value: unknown): value is Record<string, unknown> => (
		typeof value === 'object' && value !== null
	)
	const toOptionalString = (value: unknown): string | undefined => (
		typeof value === 'string' ?
			value
		: typeof value === 'number' || typeof value === 'bigint' ?
			String(value)
		: undefined
	)
	const createInitialExplainState = (): ExplainState => ({
		status: 'idle',
		error: null,
		progress: null,
		record: null,
	})
	const createInitialState = (): TransactionFlowItemState => ({
		simulation: {
			status: 'idle',
			error: null,
			result: null,
		},
		execution: {
			status: 'idle',
			error: null,
			txHash: null,
		},
		explanations: {
			simulation: createInitialExplainState(),
			execution: createInitialExplainState(),
		},
		confirmed: false,
	})
	const getTxState = (id: string): TransactionFlowItemState =>
		txStates[id] ?? createInitialState()
	const updateTxState = (
		id: string,
		update: (state: TransactionFlowItemState) => TransactionFlowItemState,
	) => {
		txOverrides = {
			...txOverrides,
			[id]: update(getTxState(id)),
		}
	}
	const updateExplainState = (
		id: string,
		kind: ExplainTarget,
		update: (state: ExplainState) => ExplainState,
	) => {
		updateTxState(id, (state) => ({
			...state,
			explanations: {
				...state.explanations,
				[kind]: update(state.explanations[kind]),
			},
		}))
	}
	const extractExplainDetails = (value: unknown): ExplainDetails => (
		!isRecord(value) ?
			{}
		:
			(() => {
				const gas = isRecord(value.gas) ? value.gas : null
				const errors = isRecord(value.errors) ? value.errors : null
				return {
					summary: toOptionalString(value.summary),
					gasUsed: toOptionalString(value.gasUsed ?? gas?.used),
					gasEstimated: toOptionalString(value.gasEstimated ?? gas?.estimated),
					revertReason: toOptionalString(value.revertReason ?? errors?.revertReason),
					errorSelector: toOptionalString(value.errorSelector ?? errors?.errorSelector),
					traceSummary: toOptionalString(value.traceSummary),
					eventSummary: toOptionalString(value.eventSummary),
				}
			})()
	)
	const buildExplainContext = (
		tx: TransactionFlowItemBase,
		state: TransactionFlowItemState,
		kind: ExplainTarget,
	): ExplainContext => (
		((details, error) => ({
			kind,
			sessionId: tx.id,
			simulationId: kind === 'simulation' ? tx.id : undefined,
			executionId: kind === 'execution' ? tx.id : undefined,
			chainId: tx.chainId,
			status:
				kind === 'simulation' ?
					state.simulation.status === 'success' ?
						'success'
					: details.revertReason || (error && error.toLowerCase().includes('revert')) ?
						'revert'
					:
						'error'
				: state.execution.status === 'completed' ?
					'success'
				: details.revertReason || (error && error.toLowerCase().includes('revert')) ?
					'revert'
				:
					'error',
			summary:
				details.summary ??
				(error ?
					`${tx.title} ${kind} failed: ${error}`
				:
					`${tx.title} ${kind} ${
						kind === 'simulation' && state.simulation.status === 'success' ?
							'completed'
						: kind === 'execution' && state.execution.status === 'completed' ?
							'completed'
						:
							'failed'
					}.`),
			gas: {
				used: details.gasUsed,
				estimated: details.gasEstimated,
			},
			errors:
				details.revertReason || details.errorSelector ?
					{
						revertReason: details.revertReason,
						errorSelector: details.errorSelector,
					}
				: undefined,
			traceSummary: details.traceSummary,
			eventSummary: details.eventSummary,
			txHash: kind === 'execution' ? state.execution.txHash ?? undefined : undefined,
		}))(
			extractExplainDetails(
				kind === 'simulation' ? state.simulation.result : null,
			),
			kind === 'simulation' ? state.simulation.error : state.execution.error,
		)
	)
	const updateExecution = (
		id: string,
		update: TransactionFlowExecutionUpdate,
	) => {
		updateTxState(id, (state) => ({
			...state,
			execution: {
				...state.execution,
				status: update.status,
				error: update.error ?? null,
				txHash: update.txHash ?? state.execution.txHash,
			},
		}))
		if (!sessionId) return
		updateTransactionSession(sessionId, (session) => ({
			...session,
			status: 'Submitted',
			lockedAt: session.lockedAt ?? Date.now(),
			execution: {
				submittedAt: session.execution?.submittedAt ?? Date.now(),
				chainId: session.execution?.chainId,
				txHash: update.txHash ?? session.execution?.txHash,
			},
			updatedAt: Date.now(),
		}))
	}
	const resolveExecutionContext = (): Omit<
		TransactionFlowExecutionArgs,
		'onStatus'
	> | null => (
		E2E_TEVM_ENABLED && e2eProvider ?
			{
				mode: 'e2e',
				provider: e2eProvider,
				walletAddress: E2E_TEVM_WALLET_ADDRESS,
			}
		: walletProvider && walletAddress ?
			{
				mode: 'wallet',
				provider: walletProvider,
				walletAddress,
			}
		:
			null
	)
	const resolveSimulationWalletAddress = () => (
		walletAddress ??
		(E2E_TEVM_ENABLED && e2eProvider ? E2E_TEVM_WALLET_ADDRESS : null)
	)
	const supportsExecutionMode = (
		tx: TransactionFlowItemBase,
		mode: TransactionFlowExecutionMode,
	) => (
		tx.executionModes ? tx.executionModes.includes(mode) : true
	)
	const refreshExplainAvailability = async () => {
		explainAvailability = await createExplainProvider().availability()
	}
	const cancelExplain = (id: string, kind: ExplainTarget) => {
		const cancel = getTxState(id).explanations[kind].cancel
		if (cancel) cancel()
		updateExplainState(id, kind, (state) => ({
			...state,
			status: 'idle',
			error: null,
			progress: null,
			cancel: undefined,
		}))
	}
	const explainTransaction = async (
		tx: TransactionFlowItem,
		kind: ExplainTarget,
	) => {
		const provider = createExplainProvider({
			onProgress: (progress) => {
				updateExplainState(tx.id, kind, (state) => ({
					...state,
					progress,
				}))
			},
		})
		updateExplainState(tx.id, kind, (state) => ({
			...state,
			status: 'loading',
			error: null,
			progress: null,
			cancel: provider.cancel,
		}))
		try {
			const availability = await provider.availability()
			explainAvailability = availability
			if (availability === 'unavailable') {
				updateExplainState(tx.id, kind, (state) => ({
					...state,
					status: 'error',
					error: 'Explain results unavailable.',
					cancel: undefined,
				}))
				return
			}
			const output = await provider.explain({
				context: buildExplainContext(tx, getTxState(tx.id), kind),
				language: 'en',
			})
			updateExplainState(tx.id, kind, (state) => ({
				...state,
				status: 'success',
				error: null,
				progress: null,
				record: createExplainRecord(output),
				cancel: undefined,
			}))
		} catch (error) {
			updateExplainState(tx.id, kind, (state) => ({
				...state,
				status: 'error',
				error: error instanceof Error ? error.message : String(error),
				progress: null,
				cancel: undefined,
			}))
		}
	}
	const simulateTransaction = async (tx: TransactionFlowItem) => {
		const simulationWalletAddress = resolveSimulationWalletAddress()
		if (!tx.simulate || !simulationWalletAddress) return
		const rpcUrl = (
			Object.entries(rpcUrls).find(
				(entry) => Number(entry?.[0]) === tx.chainId,
			)?.[1] ?? null
		)
		if (!rpcUrl) {
			updateTxState(tx.id, (state) => ({
				...state,
				simulation: {
					status: 'failed',
					error: 'Missing RPC endpoint for simulation.',
					result: null,
				},
			}))
			return
		}
		updateTxState(tx.id, (state) => ({
			...state,
			simulation: {
				status: 'running',
				error: null,
				result: null,
			},
		}))
		try {
			if (sessionId && sessionParams) {
				lockTransactionSession(sessionId)
			}
			const provider = createHttpProvider(rpcUrl)
			const result = await tx.simulate({
				provider,
				walletAddress: simulationWalletAddress,
			})
			updateTxState(tx.id, (state) => ({
				...state,
				simulation: {
					status: 'success',
					error: null,
					result,
				},
			}))
			if (sessionId && sessionParams) {
				const simulationId = createTransactionSessionSimulation({
					sessionId,
					params: sessionParams,
					status: 'success',
					result,
				})
				updateTransactionSession(sessionId, (session) => ({
					...session,
					latestSimulationId: simulationId,
					simulationCount: (session.simulationCount ?? 0) + 1,
					updatedAt: Date.now(),
				}))
			}
		} catch (error) {
			if (sessionId && sessionParams) {
				const simulationId = createTransactionSessionSimulation({
					sessionId,
					params: sessionParams,
					status: 'failed',
					result: null,
					error: error instanceof Error ? error.message : String(error),
				})
				updateTransactionSession(sessionId, (session) => ({
					...session,
					latestSimulationId: simulationId,
					simulationCount: (session.simulationCount ?? 0) + 1,
					updatedAt: Date.now(),
				}))
			}
			updateTxState(tx.id, (state) => ({
				...state,
				simulation: {
					status: 'failed',
					error: error instanceof Error ? error.message : String(error),
					result: null,
				},
			}))
		}
	}
	const executeTransaction = async (tx: TransactionFlowItem) => {
		const executionContext = resolveExecutionContext()
		if (
			!executionContext ||
			!tx.execute ||
			!supportsExecutionMode(tx, executionContext.mode)
		)
			return
		if (sessionId) {
			lockTransactionSession(sessionId)
			markTransactionSessionSubmitted(sessionId, {
				submittedAt: Date.now(),
				chainId: tx.chainId,
			})
		}
		updateExecution(tx.id, { status: 'signing' })
		try {
			const result = await tx.execute({
				...executionContext,
				onStatus: (update) => updateExecution(tx.id, update),
			})
			updateExecution(tx.id, {
				status: 'completed',
				txHash: result?.txHash,
			})
			if (sessionId) {
				markTransactionSessionFinalized(sessionId, { at: Date.now() })
			}
		} catch (error) {
			updateExecution(tx.id, {
				status: 'failed',
				error: error instanceof Error ? error.message : String(error),
			})
		}
	}

	// State
	let explainAvailability = $state<ExplainAvailability>('unavailable')
	let txOverrides = $state<Record<string, TransactionFlowItemState>>({})

	// (Derived)
	const txStates = $derived(
		Object.fromEntries(
			transactions.map((tx) => [
				tx.id,
				txOverrides[tx.id] ?? createInitialState(),
			]),
		),
	)

	$effect(() => {
		if (typeof window === 'undefined') return
		void refreshExplainAvailability()
	})
</script>


<div data-column="gap-4" data-transaction-flow>
	{#if Summary}
		<div data-column="gap-2">
			{@render Summary()}
		</div>
	{/if}

	{#if transactions.length === 0}
		<p data-muted>No transactions available.</p>
	{:else}
		{#each transactions as tx (tx.id)}
			{@const txState = getTxState(tx.id)}
			{@const simulationExplain = txState.explanations.simulation}
			{@const executionExplain = txState.explanations.execution}
			{@const network =
				Object.values(networksByChainId).find(
					(entry) => entry?.id === tx.chainId,
				) ?? null}
			{@const executionContext = resolveExecutionContext()}
			{@const hasExecutionContext = Boolean(executionContext)}
			{@const executionUnsupported =
				Boolean(executionContext && !supportsExecutionMode(tx, executionContext.mode))}
			{@const hasWalletSigner = Boolean(walletProvider && walletAddress)}
			{@const needsChainSwitch = Boolean(
				executionContext?.mode === 'wallet' &&
				walletProvider &&
				walletConnection?.connection.chainId !== null &&
				walletConnection?.connection.chainId !== tx.chainId,
			)}
			{@const confirmationRequired = tx.requiresConfirmation}
			{@const confirmationReady = !confirmationRequired || txState.confirmed}
			{@const hasPendingExecution =
				txState.execution.status === 'signing' ||
				txState.execution.status === 'executing' ||
				txState.execution.status === 'confirming'}
			{@const executeDisabled =
				!tx.execute ||
				!tx.canExecute ||
				!hasExecutionContext ||
				executionUnsupported ||
				needsChainSwitch ||
				!confirmationReady ||
				hasPendingExecution}

			<section data-column="gap-2" data-transaction>
				<div data-row="gap-2 align-center justify-between">
					<h3>{tx.title}</h3>
					{#if txState.execution.status !== 'idle'}
						<span data-muted>{txState.execution.status.replace('_', ' ')}</span>
					{/if}
				</div>

				{#if tx.Details}
					{@render tx.Details(tx, txState)}
				{/if}

				{#if tx.simulate}
					<div data-row="gap-2 align-center">
						<Button.Root
							type="button"
							onclick={() => simulateTransaction(tx)}
							disabled={txState.simulation.status === 'running'}
						>
							{txState.simulation.status === 'running'
								? 'Simulating…'
								: 'Simulate'}
						</Button.Root>
						{#if txState.simulation.status === 'success'}
							<span data-muted>Simulation ok</span>
						{:else if txState.simulation.status === 'failed'}
							<span data-error>{txState.simulation.error}</span>
						{/if}
					</div>
					{#if
						txState.simulation.status === 'success' ||
						txState.simulation.status === 'failed'}
						<div data-row="gap-2 align-center wrap">
							<Button.Root
								type="button"
								onclick={() => explainTransaction(tx, 'simulation')}
								disabled={
									simulationExplain.status === 'loading' ||
									explainAvailability === 'unavailable'
								}
							>
								{simulationExplain.status === 'loading'
									? 'Explaining…'
									: 'Explain results'}
							</Button.Root>
							{#if
								explainAvailability === 'downloading' &&
								simulationExplain.status !== 'loading'}
								<span data-muted>Model downloading…</span>
							{:else if explainAvailability === 'unavailable'}
								<span data-muted>Explain unavailable.</span>
								<a href="/about#explain-results-fallback">Set up hosted fallback</a>
							{/if}
							{#if simulationExplain.status === 'loading'}
								<span data-muted>
									{simulationExplain.progress !== null
										? `Downloading model ${Math.round(
												simulationExplain.progress * 100,
											)}%`
										: 'Generating explanation…'}
								</span>
								<Button.Root
									type="button"
									onclick={() => cancelExplain(tx.id, 'simulation')}
								>
									Cancel
								</Button.Root>
							{/if}
						</div>
						{#if simulationExplain.status === 'error'}
							<p data-error>
								{simulationExplain.error ?? 'Explanation failed.'}
							</p>
						{:else if simulationExplain.status === 'success'}
							<div data-card="secondary" data-column="gap-2">
								<p>{simulationExplain.record?.text}</p>
								{#if simulationExplain.record}
									<small data-muted>
										{simulationExplain.record.provider} ·
										{simulationExplain.record.createdAt}
									</small>
								{/if}
							</div>
						{/if}
					{/if}
				{/if}

				{#if txState.execution.status === 'failed'}
					<p data-error>{txState.execution.error ?? 'Transaction failed.'}</p>
				{/if}

				{#if txState.execution.txHash}
					<p data-muted data-tx-hash={txState.execution.txHash}>
						{txState.execution.txHash.slice(0, 8)}…
					</p>
				{/if}
				{#if
					txState.execution.status === 'completed' ||
					txState.execution.status === 'failed'}
					<div data-row="gap-2 align-center wrap">
						<Button.Root
							type="button"
							onclick={() => explainTransaction(tx, 'execution')}
							disabled={
								executionExplain.status === 'loading' ||
								explainAvailability === 'unavailable'
							}
						>
							{executionExplain.status === 'loading'
								? 'Explaining…'
								: 'Explain results'}
						</Button.Root>
						{#if
							explainAvailability === 'downloading' &&
							executionExplain.status !== 'loading'}
							<span data-muted>Model downloading…</span>
						{:else if explainAvailability === 'unavailable'}
							<span data-muted>Explain unavailable.</span>
							<a href="/about#explain-results-fallback">Set up hosted fallback</a>
						{/if}
						{#if executionExplain.status === 'loading'}
							<span data-muted>
								{executionExplain.progress !== null
									? `Downloading model ${Math.round(
											executionExplain.progress * 100,
										)}%`
									: 'Generating explanation…'}
							</span>
							<Button.Root
								type="button"
								onclick={() => cancelExplain(tx.id, 'execution')}
							>
								Cancel
							</Button.Root>
						{/if}
					</div>
					{#if executionExplain.status === 'error'}
						<p data-error>{executionExplain.error ?? 'Explanation failed.'}</p>
					{:else if executionExplain.status === 'success'}
						<div data-card="secondary" data-column="gap-2">
							<p>{executionExplain.record?.text}</p>
							{#if executionExplain.record}
								<small data-muted>
									{executionExplain.record.provider} ·
									{executionExplain.record.createdAt}
								</small>
							{/if}
						</div>
					{/if}
				{/if}

				{#if needsChainSwitch && walletProvider}
					<div data-card="secondary" data-row="gap-2 align-center">
						<span>Switch to {network?.name ?? `Chain ${tx.chainId}`}</span>
						<Button.Root
							type="button"
							onclick={() => switchWalletChain(walletProvider, tx.chainId)}
							>Switch</Button.Root
						>
					</div>
				{/if}

				{#if confirmationRequired}
					<div data-column="gap-2" data-confirmation>
						{#if tx.Confirmation}
							{@render tx.Confirmation(tx, txState)}
						{/if}
						<label data-row="gap-2 align-center">
							<Checkbox.Root
								bind:checked={() => txState.confirmed, (checked) => (
									updateTxState(tx.id, (state) => ({
										...state,
										confirmed: checked,
									}))
								)}
							>
								{#snippet children({ checked })}
									{checked ? '✓' : '○'}
								{/snippet}
							</Checkbox.Root>
							{tx.confirmationLabel ??
								'I understand this transaction is irreversible'}
						</label>
					</div>
				{/if}

				<div data-row="gap-2 align-center wrap">
					{#if executionUnsupported}
						<p data-muted>Execution not available for this mode.</p>
					{:else if !hasExecutionContext}
						<p data-muted>
							{E2E_TEVM_ENABLED
								? 'E2E provider unavailable.'
								: 'Connect a wallet to continue.'}
						</p>
					{:else if executionContext?.mode === 'wallet' && !hasWalletSigner}
						<p data-muted>Connect a signing-capable wallet to continue.</p>
					{/if}
				</div>

				<div data-row>
					<Button.Root
						type="button"
						disabled={executeDisabled}
						onclick={() => executeTransaction(tx)}
						data-row-item="flexible"
						aria-busy={hasPendingExecution ? 'true' : undefined}
					>
						{tx.actionLabel}
					</Button.Root>
				</div>
			</section>
		{/each}
	{/if}
</div>
