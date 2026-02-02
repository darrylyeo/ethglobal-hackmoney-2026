<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { WalletConnectionTransport } from '$/collections/wallet-connections'
	import { networksByChainId } from '$/constants/networks'
	import { rpcUrls } from '$/constants/rpc-endpoints'
	import type { VoltaireProvider } from '$/api/voltaire'
	import type { EIP1193Provider } from '$/lib/wallet'
	import type { Snippet } from 'svelte'

	type ExecutionStatus = 'idle' | 'signing' | 'executing' | 'confirming' | 'completed' | 'failed'
	type SimulationStatus = 'idle' | 'running' | 'success' | 'failed'
	type TransactionFlowExecutionUpdate = {
		status: ExecutionStatus
		error?: string
		txHash?: `0x${string}`
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
		confirmed: boolean
	}
	type TransactionFlowItemBase = {
		id: string
		chainId: number
		title: string
		actionLabel: string
		canExecute: boolean
		simulate?: (args: { provider: VoltaireProvider; walletAddress: `0x${string}` }) => Promise<unknown>
		execute?: (args: {
			provider: EIP1193Provider
			walletAddress: `0x${string}`
			onStatus: (update: TransactionFlowExecutionUpdate) => void
		}) => Promise<{ txHash?: `0x${string}` } | void>
		requiresConfirmation?: boolean
		confirmationLabel?: string
	}
	type TransactionFlowItem = TransactionFlowItemBase & {
		Details?: Snippet<[item: TransactionFlowItemBase, state: TransactionFlowItemState]>
		Confirmation?: Snippet<[item: TransactionFlowItemBase, state: TransactionFlowItemState]>
	}

	// Context
	import { Button, Checkbox } from 'bits-ui'

	// Functions
	import { createHttpProvider } from '$/api/voltaire'
	import { switchWalletChain } from '$/lib/wallet'

	// Props
	let {
		walletConnection,
		Summary,
		transactions,
	}: {
		walletConnection: ConnectedWallet | null
		Summary?: Snippet
		transactions: TransactionFlowItem[]
	} = $props()

	// (Derived)
	const walletProvider = $derived(
		walletConnection?.connection.transport === WalletConnectionTransport.Eip1193
			? walletConnection.wallet.provider
			: null
	)
	const walletAddress = $derived(walletConnection?.connection.activeActor ?? null)
	const walletChainId = $derived(walletConnection?.connection.chainId ?? null)
	const hasSigner = $derived(Boolean(walletProvider && walletAddress))

	// Functions
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
		confirmed: false,
	})
	const getTxState = (id: string): TransactionFlowItemState => (
		txStates[id] ?? createInitialState()
	)
	const updateTxState = (
		id: string,
		update: (state: TransactionFlowItemState) => TransactionFlowItemState,
	) => {
		txOverrides = {
			...txOverrides,
			[id]: update(getTxState(id)),
		}
	}
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
	}
	const simulateTransaction = async (tx: TransactionFlowItem) => {
		if (!tx.simulate || !walletAddress) return
		const rpcUrl = rpcUrls[tx.chainId]
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
			const provider = createHttpProvider(rpcUrl)
			const result = await tx.simulate({ provider, walletAddress })
			updateTxState(tx.id, (state) => ({
				...state,
				simulation: {
					status: 'success',
					error: null,
					result,
				},
			}))
		} catch (error) {
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
		if (!tx.execute || !walletProvider || !walletAddress) return
		updateExecution(tx.id, { status: 'signing' })
		try {
			const result = await tx.execute({
				provider: walletProvider,
				walletAddress,
				onStatus: (update) => updateExecution(tx.id, update),
			})
			updateExecution(tx.id, {
				status: 'completed',
				txHash: result?.txHash,
			})
		} catch (error) {
			updateExecution(tx.id, {
				status: 'failed',
				error: error instanceof Error ? error.message : String(error),
			})
		}
	}

	// State
	let txOverrides = $state<Record<string, TransactionFlowItemState>>({})

	// (Derived)
	const txStates = $derived(
		Object.fromEntries(
			transactions.map((tx) => (
				[
					tx.id,
					txOverrides[tx.id] ?? createInitialState(),
				]
			)),
		)
	)
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
			{@const network = networksByChainId[tx.chainId]}
			{@const needsChainSwitch = Boolean(walletProvider && walletChainId !== null && walletChainId !== tx.chainId)}
			{@const confirmationRequired = tx.requiresConfirmation}
			{@const confirmationReady = !confirmationRequired || txState.confirmed}
			{@const hasPendingExecution = txState.execution.status === 'signing' || txState.execution.status === 'executing' || txState.execution.status === 'confirming'}
			{@const executeDisabled = !tx.execute || !tx.canExecute || !hasSigner || needsChainSwitch || !confirmationReady || hasPendingExecution}

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
						<Button.Root type="button" onclick={() => simulateTransaction(tx)} disabled={txState.simulation.status === 'running'}>
							{txState.simulation.status === 'running' ? 'Simulating…' : 'Simulate'}
						</Button.Root>
						{#if txState.simulation.status === 'success'}
							<span data-muted>Simulation ok</span>
						{:else if txState.simulation.status === 'failed'}
							<span data-error>{txState.simulation.error}</span>
						{/if}
					</div>
				{/if}

				{#if txState.execution.status === 'failed'}
					<p data-error>{txState.execution.error ?? 'Transaction failed.'}</p>
				{/if}

				{#if txState.execution.txHash}
					<p data-muted>{txState.execution.txHash.slice(0, 8)}…</p>
				{/if}

				{#if needsChainSwitch && walletProvider}
					<div data-card="secondary" data-row="gap-2 align-center">
						<span>Switch to {network?.name ?? `Chain ${tx.chainId}`}</span>
						<Button.Root type="button" onclick={() => switchWalletChain(walletProvider, tx.chainId)}>Switch</Button.Root>
					</div>
				{/if}

				{#if confirmationRequired}
					<div data-column="gap-2" data-confirmation>
						{#if tx.Confirmation}
							{@render tx.Confirmation(tx, txState)}
						{/if}
						<label data-row="gap-2 align-center">
							<Checkbox.Root
								checked={txState.confirmed}
								onCheckedChange={(checked) => {
									updateTxState(tx.id, (state) => ({ ...state, confirmed: checked }))
								}}
							>
								{#snippet children({ checked })}
									{checked ? '✓' : '○'}
								{/snippet}
							</Checkbox.Root>
							{tx.confirmationLabel ?? 'I understand this transaction is irreversible'}
						</label>
					</div>
				{/if}

				<div data-row="gap-2 align-center wrap">
					{#if !walletConnection}
						<p data-muted>Connect a wallet to continue.</p>
					{:else if !hasSigner}
						<p data-muted>Connect a signing-capable wallet to continue.</p>
					{/if}
				</div>

				<div data-row>
					<Button.Root type="button" disabled={executeDisabled} onclick={() => executeTransaction(tx)} data-row-item="flexible">
						{tx.actionLabel}
					</Button.Root>
				</div>
			</section>
		{/each}
	{/if}
</div>
