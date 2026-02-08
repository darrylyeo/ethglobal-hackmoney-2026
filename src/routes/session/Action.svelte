<script lang="ts">
	// Types/constants
	import type { Action } from '$/constants/actions.ts'
	import type { SessionContext } from './session-context.ts'
	import {
		ActionType,
		actionTypeDefinitionByActionType,
		actionTypes,
		type ActionTypeDefinition,
	} from '$/constants/actions.ts'
	import type { Coin } from '$/constants/coins.ts'
	import { ercTokens } from '$/constants/coins.ts'
	import { protocolActions } from '$/constants/protocolActions.ts'
	import { Protocol, protocolsById } from '$/constants/protocols.ts'
	import { NetworkType, networks, networksByChainId } from '$/constants/networks.ts'
	import { rpcUrls } from '$/constants/rpc-endpoints.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
	import {
		SessionActionSimulationStatus,
		type SessionActionTransactionSimulation,
	} from '$/data/SessionActionTransactionSimulation.ts'
	import { TevmSimulationSummaryStatus } from '$/data/TevmSimulationResult.ts'
	import { runTevmSimulationFromClient } from '$/api/tevm/tevmSimulation.ts'
	import { resolveSigningPayloads } from '$/lib/session/resolveSigningPayloads.ts'
	import type { EIP1193Provider } from '$/lib/wallet.ts'
	import { sessionActionTransactionSimulationsCollection } from '$/collections/SessionActionTransactionSimulations.ts'
	import { sessionActionTransactionsCollection } from '$/collections/SessionActionTransactions.ts'
	import { stringify } from '$/lib/stringify.ts'


	// Context
	import { getContext } from 'svelte'
	import { SESSION_CONTEXT_KEY } from './session-context.ts'

	const sessionCtx = getContext<SessionContext>(SESSION_CONTEXT_KEY)


	// Props
	let {
		action = $bindable(),
		actionIndex = 0,
	}: {
		action: Action
		actionIndex?: number
	} = $props()


	// State: cache params by action type so switching back restores them
	let paramsByType = $state<Partial<Record<ActionType, Record<string, unknown>>>>(
		{},
	)
	$effect(() => {
		const t = action.type as ActionType
		paramsByType[t] = { ...action.params } as Record<string, unknown>
	})


	// (Derived)
	const actionTypeValue = $derived(String(action.type))
	const activeSpec = $derived(
		(actionTypes as readonly ActionTypeDefinition[]).find(
			(s) => s.type === action.type,
		),
	)
	const protocolsForAction = $derived(
		protocolActions.filter((pa) => pa.id.actionType === action.type),
	)
	const protocolOptions = $derived(
		protocolsForAction
			.map((pa) => protocolsById[pa.id.protocol])
			.filter(Boolean),
	)
	const protocolValue = $derived(action.protocolAction?.protocol ?? '')
	const paramsHash = $derived(stringify(action.params))
	const sessionId = $derived(sessionCtx.sessionId ?? '')

	const filteredNetworks = $derived(
		networks.filter((n) =>
			sessionCtx.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const chainCoins = (chainId: number) =>
		ercTokens.filter((t) => t.chainId === chainId) as Coin[]
	const asNonEmptyCoins = (coins: Coin[]): coins is [Coin, ...Coin[]] =>
		coins.length > 0

	const isParamsValid = $derived.by(() => {
		const def = actionTypeDefinitionByActionType[action.type as ActionType]
		if (!def?.params) return false
		try {
			def.params.assert(action.params)
			return true
		} catch {
			return false
		}
	})

	const signingPayloads = $derived(
		resolveSigningPayloads(action, rpcUrls ?? {}, sessionCtx.selectedActor),
	)
	const selectedConnection = $derived(
		sessionCtx.connectedWallets.find((c) => c.connection.selected),
	)
	const selectedConnectionSupportsSigning = $derived(
		selectedConnection?.connection.transport === WalletConnectionTransport.Eip1193,
	)
	const walletProvider = $derived(
		selectedConnectionSupportsSigning && selectedConnection && 'provider' in selectedConnection.wallet
			? (selectedConnection.wallet.provider as EIP1193Provider)
			: null,
	)


	// State
	let broadcastInProgress = $state(false)
	let simulateInProgress = $state(false)


	// Actions
	const onActionTypeChange = (value: string | string[] | null) => {
		if (typeof value !== 'string') return
		const nextType = value as ActionType
		const cached = paramsByType[nextType]
		action = (
			cached != null
				? { type: nextType, params: cached, protocolAction: action.protocolAction }
				: {
						type: nextType,
						params: {
							...actionTypeDefinitionByActionType[nextType].getDefaultParams(),
						},
						protocolAction: undefined,
					}
		) as Action
	}

	const onProtocolChange = (value: string | string[] | null) => {
		if (typeof value !== 'string') {
			action = { ...action, protocolAction: undefined }
			return
		}
		const protocol = value as Protocol
		action = {
			...action,
			protocolAction: { action: action.type, protocol },
		}
	}

	const runSimulation = async () => {
		if (!sessionId || signingPayloads.length === 0) return
		const payload = signingPayloads[0]
		if (!payload.rpcUrl) return
		simulateInProgress = true
		const id = globalThis.crypto?.randomUUID?.() ?? `sim-${Date.now()}`
		try {
			const { result } = await runTevmSimulationFromClient({
				rpcUrl: payload.rpcUrl,
				chainId: payload.chainId,
				from: payload.from,
				to: payload.to,
				data: payload.data,
				value: payload.value,
				gasLimit: payload.gasLimit,
			})
			const status =
				result.summaryStatus === TevmSimulationSummaryStatus.Success
					? SessionActionSimulationStatus.Success
					: SessionActionSimulationStatus.Failed
			const row: SessionActionTransactionSimulation = {
				id,
				sessionId,
				actionIndex,
				status,
				createdAt: Date.now(),
				paramsHash,
				result,
				error: result.revertReason,
			}
			sessionActionTransactionSimulationsCollection.insert(row)
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err)
			sessionActionTransactionSimulationsCollection.insert({
				id,
				sessionId,
				actionIndex,
				status: SessionActionSimulationStatus.Failed,
				createdAt: Date.now(),
				paramsHash,
				result: null,
				error: message,
			})
		} finally {
			simulateInProgress = false
		}
	}

	const broadcast = async () => {
		if (!sessionId || !walletProvider || signingPayloads.length === 0) return
		const payload = signingPayloads[0]
		broadcastInProgress = true
		try {
			const txHash = (await walletProvider.request({
				method: 'eth_sendTransaction',
				params: [
					{
						from: payload.from,
						to: payload.to,
						data: payload.data ?? '0x',
						value: payload.value
							? `0x${BigInt(payload.value).toString(16)}`
							: undefined,
						chainId: `0x${payload.chainId.toString(16)}`,
					},
				],
			})) as `0x${string}`
			if (typeof txHash === 'string' && txHash.startsWith('0x')) {
				sessionActionTransactionsCollection.insert({
					id: globalThis.crypto?.randomUUID?.() ?? `tx-${Date.now()}`,
					sessionId,
					actionIndex,
					txHash,
					chainId: payload.chainId,
					createdAt: Date.now(),
				})
			}
		} finally {
			broadcastInProgress = false
		}
	}


	// Components
	import Select from '$/components/Select.svelte'
	import AddLiquidityFieldset from '$/views/actions/AddLiquidityFieldset.svelte'
	import BridgeFieldset from '$/views/actions/BridgeFieldset.svelte'
	import SwapFieldset from '$/views/actions/SwapFieldset.svelte'
	import TransferFieldset from '$/views/actions/TransferFieldset.svelte'
	import BridgeProtocolFieldset from '$/views/protocolActions/BridgeProtocolFieldset.svelte'
	import ProtocolCardSelect from '$/views/protocolActions/ProtocolCardSelect.svelte'
	import Simulations from './Simulations.svelte'
	import TransactionSigningPayloadList from './TransactionSigningPayloadList.svelte'
	import Transactions from './Transactions.svelte'
</script>


<details
	data-session-action
	data-card
	data-column="gap-3"
	open
>
	<summary data-row="gap-2 align-center justify-between">
		<h3>
			<Select
				items={actionTypes as readonly ActionTypeDefinition[]}
				getItemId={(item: ActionTypeDefinition) => item.type}
				getItemLabel={(item: ActionTypeDefinition) => `${item.icon} ${item.label}`}
				bind:value={() => actionTypeValue, onActionTypeChange}
				placeholder="Select action"
				ariaLabel="Action"
			/>
		</h3>
	</summary>

	<div data-column="gap-4">
		<form data-grid="columns-autofit column-min-16 gap-4">
			<section data-card data-column="gap-3">
				<h3>Parameters</h3>
				{#if action.type === ActionType.Swap}
					<SwapFieldset
						bind:action
						{filteredNetworks}
						{chainCoins}
						{asNonEmptyCoins}
					/>
				{:else if action.type === ActionType.Bridge}
					<BridgeFieldset bind:action {filteredNetworks} />
				{:else if action.type === ActionType.Transfer}
					<TransferFieldset
						bind:action
						{filteredNetworks}
						{chainCoins}
						{asNonEmptyCoins}
					/>
				{:else if action.type === ActionType.AddLiquidity}
					<AddLiquidityFieldset
						bind:action
						{filteredNetworks}
						{chainCoins}
						{asNonEmptyCoins}
					/>
				{:else if activeSpec}
					<p data-muted>{activeSpec.label} params</p>
				{/if}
			</section>

			<section data-card data-column="gap-2">
				<h3>Protocol</h3>
				{#if action.type === ActionType.Bridge}
					<BridgeProtocolFieldset bind:action isTestnet={sessionCtx.isTestnet} />
				{:else}
					<ProtocolCardSelect
						options={protocolOptions}
						value={protocolValue}
						onSelect={(protocol) => onProtocolChange(protocol ?? null)}
					/>
				{/if}
			</section>

			<section data-card data-column="gap-2">
				<h3>Transactions</h3>
				<TransactionSigningPayloadList
					payloads={signingPayloads}
					networksByChainId={networksByChainId}
				/>
				<div data-row="gap-2">
					<button
						type="button"
						disabled={
							!isParamsValid ||
							signingPayloads.length === 0 ||
							!signingPayloads[0]?.rpcUrl ||
							simulateInProgress
						}
						onclick={runSimulation}
					>
						{simulateInProgress ? 'Simulating…' : 'Simulate'}
					</button>
					<button
				type="button"
				disabled={
					!isParamsValid ||
					!selectedConnectionSupportsSigning ||
					signingPayloads.length === 0 ||
					broadcastInProgress
				}
				onclick={broadcast}
			>
				{broadcastInProgress ? 'Signing and broadcasting…' : 'Sign and Broadcast'}
			</button>
				</div>
			</section>
		</form>

		{#if sessionId}
			<div data-row="gap-4">
				<div data-row-item="flexible">
					<Simulations sessionId={sessionId} {actionIndex} />
				</div>
				<div data-row-item="flexible">
					<Transactions sessionId={sessionId} {actionIndex} />
				</div>
			</div>
		{/if}
	</div>
</details>
