<script lang="ts">
	// Types/constants
	import {
		ActionType,
		actionTypeDefinitionByActionType,
		actionTypes,
		mergeActionParams,
		type Action,
		type ActionParams,
		type ActionTypeDefinition,
		type BridgeParams,
		type LiquidityAction,
		type SwapParams,
	} from '$/constants/actions.ts'
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import type { CoinInstance } from '$/constants/coin-instances.ts'
	import { erc20TokenByNetwork } from '$/constants/coin-instances.ts'
	import { protocolActions } from '$/constants/protocolActions.ts'
	import {
		BridgeProtocolId,
		bridgeIdToProtocol,
		protocolToBridgeId,
	} from '$/constants/bridge-protocol-intents.ts'
	import { SwapProtocolId, swapIdToProtocol } from '$/constants/swap-protocol-intents.ts'
	import { aggregatorBackedProtocols, protocolToQuoteProvider } from '$/constants/protocol-aggregator-providers.ts'
	import {
		ProtocolId,
		ProtocolAggregatorId,
		protocolAggregatorsById,
		protocolsById,
		ProtocolStrategy,
	} from '$/constants/protocols.ts'
	import { getBridgeProtocolOptions } from '$/lib/protocols/bridgeProtocolOptions.ts'
	import { NetworkType, networks, networksByChainId } from '$/constants/networks.ts'
	import { getEffectiveRpcUrls } from '$/lib/helios-rpc.ts'
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
	import { assertActionParams, getValidatedActionParams } from '$/lib/session/params.ts'
	import {
		resolveSigningPayloads,
	} from '$/lib/session/resolveSigningPayloads.ts'
	import type { EIP1193Provider } from '$/lib/wallet.ts'
	import { stringify as devalueStringify } from 'devalue'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import {
		getBridgeQuoteRequestKey,
		getBridgeQuote,
		bridgeQuoteItemsCollection,
	} from '$/collections/BridgeQuoteItems.ts'
	import {
		getRequestKeyForParams,
		protocolAggregatorQuoteItemsCollection,
	} from '$/collections/ProtocolAggregatorQuoteItems.ts'
	import { sessionActionTransactionSimulationsCollection } from '$/collections/SessionActionTransactionSimulations.ts'
	import { sessionActionTransactionsCollection } from '$/collections/SessionActionTransactions.ts'
	import { stringify } from '$/lib/stringify.ts'
	import { formatAddress } from '$/lib/address.ts'
	import { formatSmallestToDecimal } from '$/lib/format.ts'
	import { consumeSessionCommand } from '$/state/session-command.svelte.ts'
	import { Button, Dialog } from 'bits-ui'


	// Props
	let {
		action = $bindable(),
		indexInSequence = 0,
		connectedWallets = [],
		selectedActor = null,
		selectedChainId = null,
		isTestnet = false,
		sessionId = '',
		triggerSimulate = false,
		triggerExecute = false,
	}: {
		action: Action
		indexInSequence?: number
		connectedWallets?: ConnectedWallet[]
		selectedActor?: `0x${string}` | null
		selectedChainId?: number | null
		isTestnet?: boolean
		sessionId?: string
		triggerSimulate?: boolean
		triggerExecute?: boolean
	} = $props()


	// State
	let paramsByType = $state<Partial<Record<ActionType, Record<string, unknown>>>>(
		{},
	)
	let broadcastInProgress = $state(false)
	let simulateInProgress = $state(false)
	let cctpConfirmOpen = $state(false)


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
	const validatedSwapParams = $derived(
		action.type === ActionType.Swap
			? getValidatedActionParams(ActionType.Swap, action.params)
			: null,
	)
	const validatedBridgeParams = $derived(
		action.type === ActionType.Bridge
			? getValidatedActionParams(ActionType.Bridge, action.params)
			: null,
	)
	const bridgeParams = $derived(
		action.type === ActionType.Bridge
			? (validatedBridgeParams ?? (action.params as BridgeParams))
			: null,
	)
	const protocolOptions = $derived(
		action.type === ActionType.Bridge && bridgeParams
			? getBridgeProtocolOptions(
				bridgeParams.fromChainId ?? null,
				bridgeParams.toChainId ?? null,
				isTestnet ?? false,
			)
			: (protocolsForAction
				.map((pa) => protocolsById[pa.id.protocol])
				.filter(Boolean) as import('$/constants/protocols.ts').Protocol[]),
	)
	const swapParams = $derived(
		action.type === ActionType.Swap ? (validatedSwapParams ?? (action.params as SwapParams)) : null,
	)
	const swapProtocolIntent = $derived(swapParams?.swapProtocolIntent ?? SwapProtocolId.Auto)
	const swapAggregator = $derived(swapParams?.swapAggregator ?? ProtocolAggregatorId.Spandex)
	const swapStrategy = $derived(swapParams?.swapStrategy ?? ProtocolStrategy.BestPrice)
	const resolvedProtocol = $derived(
		action.type === ActionType.Swap
			? (swapProtocolIntent !== SwapProtocolId.Auto && swapIdToProtocol[swapProtocolIntent])
				? swapIdToProtocol[swapProtocolIntent]!
				: null
			: (() => {
					const sel = action.protocolSelection ?? action.protocolAction?.protocol ?? ''
					if (!sel) return null
					if (protocolOptions.some((o) => o.id === sel))
						return sel as ProtocolId
					return (action.protocolAction?.protocol ?? null) as ProtocolId | null
				})(),
	)
	const swapShowsQuoteSection = $derived(
		action.type === ActionType.Swap &&
			(protocolAggregatorsById[swapAggregator]?.strategies.length ?? 0) > 0 &&
			(swapProtocolIntent === SwapProtocolId.Auto ||
				(swapIdToProtocol[swapProtocolIntent] != null &&
					aggregatorBackedProtocols.includes(swapIdToProtocol[swapProtocolIntent]!))),
	)
	const paramsHash = $derived(stringify(action.params))
	const isCctpBridge = $derived(
		action.type === ActionType.Bridge &&
			(bridgeParams?.protocolIntent === BridgeProtocolId.Cctp ||
				resolvedProtocol === ProtocolId.Cctp),
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const chainCoins = (chainId: number) =>
		(erc20TokenByNetwork.get(chainId) ?? []) as CoinInstance[]
	const asNonEmptyCoins = (coins: CoinInstance[]): coins is [CoinInstance, ...CoinInstance[]] =>
		coins.length > 0

	const isParamsValid = $derived.by(() => {
		const def = actionTypeDefinitionByActionType[action.type as ActionType]
		if (!def?.params) return false
		return def.params.allows(action.params)
	})

	const swapParamsForRequest = $derived(
		validatedSwapParams && selectedActor ? validatedSwapParams : null,
	)
	const swapRequestKey = $derived.by(() => {
		if (!validatedSwapParams || !selectedActor) return ''
		return getRequestKeyForParams(
			{
				chainId: validatedSwapParams.chainId,
				tokenIn: validatedSwapParams.tokenIn as `0x${string}`,
				tokenOut: validatedSwapParams.tokenOut as `0x${string}`,
				amountIn: validatedSwapParams.amount,
				slippage: validatedSwapParams.slippage,
			},
			selectedActor,
		)
	})
	const selectedQuoteProvider = $derived(
		action.type === ActionType.Swap &&
			swapProtocolIntent !== SwapProtocolId.Auto &&
			resolvedProtocol
			? (protocolToQuoteProvider[resolvedProtocol] ?? null)
			: null,
	)
	const swapQuotesQuery = useLiveQuery((q) =>
		q
			.from({ row: protocolAggregatorQuoteItemsCollection })
			.select(({ row }) => ({ row })),
	)
	const swapQuoteTx = $derived.by(() => {
		if (!swapRequestKey || !swapQuotesQuery.data || !swapShowsQuoteSection) return undefined
		const items = (swapQuotesQuery.data ?? [])
			.map(({ row }) => row)
			.filter(
				(quote) =>
					quote.$id.requestId === swapRequestKey &&
					quote.success &&
					quote.transactionRequest != null,
			)
		const item = selectedQuoteProvider
			? items.find((r) => r.provider === selectedQuoteProvider)
			: [...items].sort(
					(a, b) => ((b.simulatedOutputAmount ?? 0n) > (a.simulatedOutputAmount ?? 0n) ? 1 : -1),
				)[0]
		return item?.transactionRequest ?? undefined
	})
	const bridgeParamsForQuote = $derived.by(() => {
		if (
			action.type !== ActionType.Bridge ||
			!selectedActor ||
			!validatedBridgeParams ||
			(validatedBridgeParams.protocolIntent !== BridgeProtocolId.Lifi &&
				resolvedProtocol !== ProtocolId.LiFi) ||
			validatedBridgeParams.fromChainId == null ||
			validatedBridgeParams.toChainId == null ||
			validatedBridgeParams.amount <= 0n
		)
			return null
		return {
			fromChainId: validatedBridgeParams.fromChainId,
			toChainId: validatedBridgeParams.toChainId,
			amount: validatedBridgeParams.amount,
			fromAddress: selectedActor,
			slippage: validatedBridgeParams.slippage ?? 0.005,
		}
	})
	const bridgeQuoteRequestKey = $derived(
		bridgeParamsForQuote ? getBridgeQuoteRequestKey(bridgeParamsForQuote) : '',
	)
	const bridgeQuotesQuery = useLiveQuery((q) =>
		q
			.from({ row: bridgeQuoteItemsCollection })
			.select(({ row }) => ({ row })),
	)
	const lifiBridgeTxs = $derived.by(() => {
		bridgeQuotesQuery.data
		const quote = bridgeQuoteItemsCollection.state.get(bridgeQuoteRequestKey)
		return quote?.success ? quote.transactionRequests : undefined
	})
	const signingPayloads = $derived(
		resolveSigningPayloads(action, getEffectiveRpcUrls(), selectedActor, {
			selectedChainId,
			isTestnet,
			swapQuoteTx,
			lifiBridgeTxs,
		}),
	)
	const selectedConnection = $derived(
		connectedWallets.find((c) => c.connection.selected),
	)
	const selectedConnectionSupportsSigning = $derived(
		selectedConnection?.connection.transport === WalletConnectionTransport.Eip1193,
	)
	const actors = $derived(
		connectedWallets.flatMap((c) => c.connection.actors ?? []),
	)
	const walletProvider = $derived(
		selectedConnectionSupportsSigning && selectedConnection && 'provider' in selectedConnection.wallet
			? (selectedConnection.wallet.provider as EIP1193Provider)
			: null,
	)


	// Actions
	const onActionTypeChange = (value: string | string[] | undefined) => {
		if (typeof value !== 'string') return
		const nextType = value as ActionType
		paramsByType[action.type as ActionType] = {
			...action.params,
		} as Record<string, unknown>
		const cached = paramsByType[nextType]
		action = mergeActionParams({
			type: nextType,
			params: cached ?? {},
			protocolAction: cached != null ? action.protocolAction : undefined,
			protocolSelection: undefined,
		} as Action) as Action
	}

	const onProtocolChange = (value: string | string[] | undefined) => {
		if (action.type === ActionType.Swap) return
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
		const valid = protocolOptions.some((o) => o.id === value)
		const bridgeIntent =
			action.type === ActionType.Bridge && valid ? protocolToBridgeId[value as ProtocolId] : undefined
		action = {
			...action,
			protocolSelection: value,
			protocolAction: valid ? { action: action.type, protocol: value } : undefined,
			...(action.type === ActionType.Bridge && action.params && 'protocolIntent' in action.params
				? { params: { ...action.params, protocolIntent: bridgeIntent ?? null } }
				: {}),
		} as Action
	}

	$effect(() => {
		if (action.type === ActionType.Swap) return
		const sel = action.protocolSelection ?? action.protocolAction?.protocol ?? ''
		if (!sel) return
		const valid = protocolOptions.some((o) => o.id === sel)
		if (valid && sel !== action.protocolAction?.protocol)
			action = { ...action, protocolAction: { action: action.type, protocol: sel } } as Action
		else if (!valid && action.protocolAction)
			action = { ...action, protocolAction: undefined } as Action
	})

	const runSimulation = async () => {
		if (!sessionId || signingPayloads.length === 0) return
		const withRpc = signingPayloads.filter(
			(p): p is typeof p & { rpcUrl: string } => Boolean(p.rpcUrl),
		)
		if (withRpc.length === 0) return
		try {
			assertActionParams(action.type, action.params)
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err)
			sessionActionTransactionSimulationsCollection.insert({
				id: globalThis.crypto?.randomUUID?.() ?? `sim-${Date.now()}`,
				sessionId,
				indexInSequence,
				status: SessionActionSimulationStatus.Failed,
				createdAt: Date.now(),
				paramsHash,
				result: null,
				error: message,
			})
			return
		}
		simulateInProgress = true
		const id = globalThis.crypto?.randomUUID?.() ?? `sim-${Date.now()}`
		try {
			const payloads = withRpc.map((p) => ({
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
			const simulation: SessionActionTransactionSimulation = {
				id,
				sessionId,
				indexInSequence,
				status,
				createdAt: Date.now(),
				paramsHash,
				result,
				error: firstRevert,
			}
			sessionActionTransactionSimulationsCollection.insert(simulation)
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err)
			sessionActionTransactionSimulationsCollection.insert({
				id,
				sessionId,
				indexInSequence,
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
		if ((e.submitter as HTMLButtonElement | undefined)?.value === 'broadcast') {
			if (isCctpBridge) cctpConfirmOpen = true
			else broadcast()
		} else {
			runSimulation()
		}
	}

	const onCctpConfirm = () => {
		cctpConfirmOpen = false
		broadcast().finally(consumeSessionCommand)
	}

	const broadcast = async () => {
		if (!sessionId || !walletProvider || signingPayloads.length === 0) return
		try {
			assertActionParams(action.type, action.params)
		} catch {
			return
		}
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
					indexInSequence,
					txHash,
					chainId: payload.chainId,
					createdAt: Date.now(),
				})
			}
		} finally {
			broadcastInProgress = false
		}
	}

	$effect(() => {
		if (triggerSimulate && sessionId) {
			runSimulation().finally(consumeSessionCommand)
		}
	})
	$effect(() => {
		if (!triggerExecute || !sessionId) return
		if (isCctpBridge) cctpConfirmOpen = true
		else broadcast().finally(consumeSessionCommand)
	})


	// Components
	import Select from '$/components/Select.svelte'
	import AddLiquidityFieldset from '$/views/actions/AddLiquidityFieldset.svelte'
	import BridgeFieldset from '$/views/actions/BridgeFieldset.svelte'
	import BridgeQuotes from '$/views/actions/BridgeQuotes.svelte'
	import IntentsQuote from '$/views/actions/IntentsQuote.svelte'
	import ProtocolAggregatorQuotes from '$/views/actions/ProtocolAggregatorQuotes.svelte'
	import SwapFieldset from '$/views/actions/SwapFieldset.svelte'
	import TransferFieldset from '$/views/actions/TransferFieldset.svelte'
	import BridgeProtocolFieldset from './BridgeProtocolFieldset.svelte'
	import ProtocolInput from './ProtocolInput.svelte'
	import Simulations from './Simulations.svelte'
	import SwapProtocolFieldset from './SwapProtocolFieldset.svelte'
	import TransactionSigningPayloadList from './TransactionSigningPayloadList.svelte'
	import Transactions from './Transactions.svelte'
</script>


<details
	data-card
	open
>
	<summary data-row="justify-between">
		<h3>
			<Select
				items={actionTypes as readonly ActionTypeDefinition[]}
				bind:value={() => activeSpec ?? undefined, (item) => onActionTypeChange(item ? item.type : undefined)}
				getItemId={(item: ActionTypeDefinition) => item.type}
				getItemLabel={(item: ActionTypeDefinition) => `${item.icon} ${item.label}`}
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
						{actors}
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
				{#if action.type === ActionType.Swap}
					<SwapProtocolFieldset bind:action />
				{:else}
					{@const protocolValue = action.type === ActionType.Bridge && bridgeParams
						? (bridgeParams.protocolIntent
							? bridgeIdToProtocol[bridgeParams.protocolIntent]
							: action.protocolAction?.protocol ?? '')
						: (action.protocolSelection ?? action.protocolAction?.protocol ?? '')}
					<ProtocolInput
						options={protocolOptions}
						value={protocolValue}
						activeProtocolId={resolvedProtocol}
						onSelect={(protocol) => onProtocolChange(protocol ?? undefined)}
					/>
					{#if action.type === ActionType.Bridge}
						<BridgeProtocolFieldset bind:action isTestnet={isTestnet} actors={actors} />
					{/if}
				{/if}
			</section>

			{#if action.type === ActionType.Swap || action.type === ActionType.Bridge}
				<section data-card data-column>
					<h3>Quote</h3>
					{#if action.type === ActionType.Swap}
					{#if swapShowsQuoteSection}
						<ProtocolAggregatorQuotes
							params={validatedSwapParams}
							provider={selectedQuoteProvider ?? undefined}
							strategy={swapStrategy}
							swapperAccount={selectedActor}
						/>
						{/if}
						{#if swapProtocolIntent === SwapProtocolId.NearIntents}
							<IntentsQuote
								flow="swap"
								params={validatedSwapParams}
								fromAddress={selectedActor}
							/>
						{/if}
					{:else if action.type === ActionType.Bridge}
						{#if bridgeParams?.protocolIntent === BridgeProtocolId.Lifi || resolvedProtocol === ProtocolId.LiFi}
							<BridgeQuotes
								params={validatedBridgeParams}
								fromAddress={selectedActor}
							/>
						{/if}
						{#if bridgeParams?.protocolIntent === BridgeProtocolId.NearIntents || resolvedProtocol === ProtocolId.NearIntents}
							<IntentsQuote
								flow="bridge"
								params={validatedBridgeParams}
								fromAddress={selectedActor}
							/>
						{/if}
					{/if}
				</section>
			{/if}

			<section data-card class="proposed-transactions-section">
				{#if true}
					{@const proposedTransactionsHeading = new Intl.PluralRules('en').select(signingPayloads.length) === 'one'
						? 'Proposed Transaction'
						: 'Proposed Transactions'}
					<h3>{proposedTransactionsHeading}</h3>
					<TransactionSigningPayloadList payloads={signingPayloads} />
					<div data-row>
						<button
							type="submit"
							name="action"
							value="simulate"
							disabled={
								!isParamsValid
								|| signingPayloads.length === 0
								|| signingPayloads.every((p) => !p.rpcUrl)
								|| simulateInProgress
							}
						>
							{simulateInProgress ? 'Simulating…' : 'Simulate'}
						</button>
						<button
							type="submit"
							name="action"
							value="broadcast"
							disabled={
								!isParamsValid
								|| !selectedConnectionSupportsSigning
								|| signingPayloads.length === 0
								|| broadcastInProgress
							}
						>
							{broadcastInProgress ? 'Signing and broadcasting…' : 'Sign & Broadcast'}
						</button>
					</div>
				{/if}
			</section>
		</form>

		{#if sessionId}
			<div data-row="gap-4">
				<div data-row-item="flexible">
					<Simulations sessionId={sessionId} {indexInSequence} />
				</div>
				<div data-row-item="flexible">
					<Transactions sessionId={sessionId} {indexInSequence} />
				</div>
			</div>
		{/if}
	</div>

	{#if isCctpBridge}
		<Dialog.Root bind:open={cctpConfirmOpen}>
			<Dialog.Portal>
				<Dialog.Content>
					<Dialog.Title>Confirm CCTP transfer</Dialog.Title>
					{#if bridgeParams && selectedActor && bridgeParams.fromChainId != null && bridgeParams.toChainId != null}
						{@const fromNet = Object.values(networksByChainId).find((n) => n?.chainId === bridgeParams.fromChainId)}
						{@const toNet = Object.values(networksByChainId).find((n) => n?.chainId === bridgeParams.toChainId)}
						{#if fromNet && toNet}
							<Dialog.Description>
								Send {formatSmallestToDecimal(bridgeParams.amount ?? 0n, 6)} USDC from {fromNet.name}
								to {toNet.name}. Recipient: {formatAddress(selectedActor)}.
							</Dialog.Description>
						{/if}
					{/if}
					<div data-row class="dialog-actions">
						<Button.Root
							type="button"
							onclick={() => {
								cctpConfirmOpen = false
							}}
						>Cancel</Button.Root>
						<Button.Root type="button" onclick={onCctpConfirm}>Confirm</Button.Root>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	{/if}
</details>

<style>
	.proposed-transactions-section {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.dialog-actions {
		margin-top: 1rem;
	}

	button {
		font-size: 1em;
	}
</style>
