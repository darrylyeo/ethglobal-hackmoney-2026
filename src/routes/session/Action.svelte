<script lang="ts">
	// Types/constants
	import type { Action } from '$/constants/actions.ts'
	import type { SessionContext } from './session-context.ts'
	import {
		ActionType,
		actionTypeDefinitionByActionType,
		actionTypes,
		type ActionTypeDefinition,
		type LiquidityAction,
		mergeActionParams,
	} from '$/constants/actions.ts'
	import type { Coin } from '$/constants/coins.ts'
	import { ercTokens } from '$/constants/coins.ts'
	import { protocolActions } from '$/constants/protocolActions.ts'
	import {
		Protocol,
		ProtocolTag,
		bridgeIdToProtocol,
		protocolToBridgeId,
		protocolsById,
	} from '$/constants/protocols.ts'
	import { getBridgeProtocolOptions } from '$/lib/protocols/bridgeProtocolOptions.ts'
	import { NetworkType, networks, networksByChainId } from '$/constants/networks.ts'
	import { rpcUrls } from '$/constants/rpc-endpoints.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
	import {
		SessionActionSimulationStatus,
		type SessionActionTransactionSimulation,
	} from '$/data/SessionActionTransactionSimulation.ts'
	import { TevmSimulationSummaryStatus } from '$/data/TevmSimulationResult.ts'
	import {
	runTevmSimulationFromClientBatch,
	type TevmSimulationPayload,
} from '$/api/tevm/tevmSimulation.ts'
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
		if (action == null) return
		if (action.params == null) action = mergeActionParams(action as Action)
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
	const bridgeParams = $derived(
		action.type === ActionType.Bridge
			? (action.params as { fromChainId: number | null; toChainId: number | null; protocolIntent?: 'cctp' | 'lifi' | 'gateway' | null })
			: null,
	)
	const protocolOptions = $derived(
		action.type === ActionType.Bridge && bridgeParams
			? getBridgeProtocolOptions(
					bridgeParams.fromChainId ?? null,
					bridgeParams.toChainId ?? null,
					sessionCtx.isTestnet ?? false,
				)
			: (protocolsForAction
					.map((pa) => protocolsById[pa.id.protocol])
					.filter(Boolean) as import('$/constants/protocols.ts').ProtocolDefinition[]),
	)
	const resolveSelection = (sel: string, opts: readonly { id: string; tags?: readonly ProtocolTag[] }[]) =>
		opts.find((o) => o.id === sel)
			? sel
			: opts.find((o) => o.tags?.includes(sel as ProtocolTag))?.id ?? sel
	const resolvedProtocol = $derived(
		(() => {
			const sel = action.protocolSelection ?? action.protocolAction?.protocol ?? ''
			if (!sel) return null
			return resolveSelection(sel, protocolOptions) as Protocol | null
		})(),
	)
	const protocolValue = $derived(
		action.type === ActionType.Bridge && bridgeParams
			? (bridgeParams.protocolIntent
					? bridgeIdToProtocol[bridgeParams.protocolIntent]
					: action.protocolAction?.protocol ?? '')
			: (action.protocolSelection ?? action.protocolAction?.protocol ?? ''),
	)
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
	const proposedTransactionsHeading = $derived(
		new Intl.PluralRules('en').select(signingPayloads.length) === 'one'
			? 'Proposed Transaction'
			: 'Proposed Transactions',
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
				? { type: nextType, params: cached, protocolAction: action.protocolAction, protocolSelection: undefined }
				: {
						type: nextType,
						params: {
							...actionTypeDefinitionByActionType[nextType].getDefaultParams(),
						},
						protocolAction: undefined,
						protocolSelection: undefined,
					}
		) as Action
	}

	const onProtocolChange = (value: string | string[] | null) => {
		if (typeof value !== 'string' || value === '') {
			action = {
				...action,
				protocolSelection: undefined,
				protocolAction: undefined,
				...(action.type === ActionType.Bridge && action.params && 'protocolIntent' in action.params
					? { params: { ...action.params, protocolIntent: null } }
					: {}),
			} as Action
			return
		}
		const resolved = resolveSelection(value, protocolOptions)
		const valid = protocolOptions.some((o) => o.id === resolved)
		const bridgeIntent =
			action.type === ActionType.Bridge && valid ? protocolToBridgeId[resolved as Protocol] : undefined
		action = {
			...action,
			protocolSelection: value,
			protocolAction: valid ? { action: action.type, protocol: resolved } : undefined,
			...(action.type === ActionType.Bridge && action.params && 'protocolIntent' in action.params
				? { params: { ...action.params, protocolIntent: bridgeIntent ?? null } }
				: {}),
		} as Action
	}

	$effect(() => {
		const sel = action.protocolSelection ?? action.protocolAction?.protocol ?? ''
		if (!sel) return
		const resolved = resolveSelection(sel, protocolOptions)
		const valid = protocolOptions.some((o) => o.id === resolved)
		if (valid && resolved !== action.protocolAction?.protocol)
			action = { ...action, protocolAction: { action: action.type, protocol: resolved } } as Action
		else if (!valid && action.protocolAction)
			action = { ...action, protocolAction: undefined } as Action
	})

	const runSimulation = async () => {
		if (!sessionId || signingPayloads.length === 0) return
		const withRpc = signingPayloads.filter(
			(p): p is typeof p & { rpcUrl: string } => Boolean(p.rpcUrl),
		)
		if (withRpc.length === 0) return
		simulateInProgress = true
		const id = globalThis.crypto?.randomUUID?.() ?? `sim-${Date.now()}`
		try {
			const payloads: TevmSimulationPayload[] = withRpc.map((p) => ({
				rpcUrl: p.rpcUrl,
				chainId: p.chainId,
				from: p.from,
				to: p.to,
				data: p.data,
				value: p.value,
				gasLimit: p.gasLimit,
			}))
			const { result } = await runTevmSimulationFromClientBatch(payloads)
			const steps = 'steps' in result ? result.steps : [result]
			const status =
				steps.length > 0 && steps.every((s) => s.summaryStatus === TevmSimulationSummaryStatus.Success)
					? SessionActionSimulationStatus.Success
					: SessionActionSimulationStatus.Failed
			const firstRevert = steps.find((s) => s.revertReason)?.revertReason
			const row: SessionActionTransactionSimulation = {
				id,
				sessionId,
				actionIndex,
				status,
				createdAt: Date.now(),
				paramsHash,
				result,
				error: firstRevert,
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

	const onSubmit = (e: SubmitEvent) => {
		e.preventDefault()
		if ((e.submitter as HTMLButtonElement | undefined)?.value === 'broadcast') broadcast()
		else runSimulation()
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
	import ProtocolInput from '$/views/protocolActions/ProtocolInput.svelte'
	import Simulations from './Simulations.svelte'
	import TransactionSigningPayloadList from './TransactionSigningPayloadList.svelte'
	import Transactions from './Transactions.svelte'
</script>


<details
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
		<form data-grid="columns-autofit column-min-16 gap-4" onsubmit={onSubmit}>
			<section data-card data-column>
				<h3>Parameters</h3>
				{#if action.type === ActionType.Swap}
					<SwapFieldset
						bind:action={action as Action<ActionType.Swap>}
						{filteredNetworks}
						{chainCoins}
						{asNonEmptyCoins}
					/>
				{:else if action.type === ActionType.Bridge}
					<BridgeFieldset bind:action={action as Action<ActionType.Bridge>} {filteredNetworks} />
				{:else if action.type === ActionType.Transfer}
					<TransferFieldset
						bind:action={action as Action<ActionType.Transfer>}
						{filteredNetworks}
						{chainCoins}
						{asNonEmptyCoins}
					/>
				{:else if action.type === ActionType.AddLiquidity || action.type === ActionType.RemoveLiquidity || action.type === ActionType.CollectFees || action.type === ActionType.IncreaseLiquidity}
					<AddLiquidityFieldset
						bind:action={action as LiquidityAction}
						{filteredNetworks}
						{chainCoins}
						{asNonEmptyCoins}
					/>
				{:else if activeSpec && Object.keys((action.params as object) ?? {}).length > 0}
					<p data-text="muted">{activeSpec.label} params</p>
				{/if}
			</section>

			<section data-card data-column>
				<h3>Protocol</h3>
				<ProtocolInput
					options={protocolOptions}
					value={protocolValue}
					onSelect={(protocol) => onProtocolChange(protocol ?? null)}
				/>
				{#if action.type === ActionType.Bridge}
					<BridgeProtocolFieldset bind:action isTestnet={sessionCtx.isTestnet} />
				{/if}
			</section>

			<section data-card data-column>
				<h3>{proposedTransactionsHeading}</h3>
				<div data-row="center">
					<button
						type="submit"
						name="action"
						value="simulate"
						disabled={
							!isParamsValid ||
							signingPayloads.length === 0 ||
							signingPayloads.every((p) => !p.rpcUrl) ||
							simulateInProgress
						}
					>
						{simulateInProgress ? 'Simulating…' : 'Simulate'}
					</button>
					<button
						type="submit"
						name="action"
						value="broadcast"
						disabled={
							!isParamsValid ||
							!selectedConnectionSupportsSigning ||
							signingPayloads.length === 0 ||
							broadcastInProgress
						}
					>
						{broadcastInProgress ? 'Signing and broadcasting…' : 'Sign & Broadcast'}
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

<style>
	button {
		font-size: 1em;
	}
</style>
