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
		type LiquidityAction,
	} from '$/constants/actions.ts'
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import type { Coin } from '$/constants/coins.ts'
	import { ercTokens } from '$/constants/coins.ts'
	import { protocolActions } from '$/constants/protocolActions.ts'
	import {
		BridgeProtocolId,
		bridgeIdToProtocol,
		protocolToBridgeId,
	} from '$/constants/bridge-protocol-intents.ts'
	import { SwapProtocolId, swapIdToProtocol } from '$/constants/swap-protocol-intents.ts'
	import { protocolToSpandexProvider, spandexSwapProtocols } from '$/constants/spandex-providers.ts'
	import { Protocol, protocolsById } from '$/constants/protocols.ts'
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
	import {
		resolveSigningPayloads,
	} from '$/lib/session/resolveSigningPayloads.ts'
	import type { EIP1193Provider } from '$/lib/wallet.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import {
		getBridgeQuoteRequestKey,
		getBridgeQuote,
		bridgeQuoteItemsCollection,
	} from '$/collections/BridgeQuoteItems.ts'
	import {
		getRequestKeyForParams,
		spandexQuoteItemsCollection,
	} from '$/collections/SpandexQuoteItems.ts'
	import { sessionActionTransactionSimulationsCollection } from '$/collections/SessionActionTransactionSimulations.ts'
	import { sessionActionTransactionsCollection } from '$/collections/SessionActionTransactions.ts'
	import { stringify } from '$/lib/stringify.ts'
	import { formatAddress } from '$/lib/address.ts'
	import { formatSmallestToDecimal } from '$/lib/format.ts'
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
	}: {
		action: Action
		indexInSequence?: number
		connectedWallets?: ConnectedWallet[]
		selectedActor?: `0x${string}` | null
		selectedChainId?: number | null
		isTestnet?: boolean
		sessionId?: string
	} = $props()


	// State: cache params by action type so switching back restores them
	let paramsByType = $state<Partial<Record<ActionType, Record<string, unknown>>>>(
		{},
	)


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
					isTestnet ?? false,
				)
			: (protocolsForAction
					.map((pa) => protocolsById[pa.id.protocol])
					.filter(Boolean) as import('$/constants/protocols.ts').ProtocolDefinition[]),
	)
	const swapParams = $derived(
		action.type === ActionType.Swap
			? (action.params as { swapProtocolIntent?: string; swapStrategy?: string })
			: null,
	)
	const swapProtocolIntent = $derived(
		(swapParams?.swapProtocolIntent as SwapProtocolId) ?? SwapProtocolId.Auto,
	)
	const swapStrategy = $derived(
		(swapParams?.swapStrategy as 'bestPrice' | 'fastest' | 'estimatedGas') ?? 'bestPrice',
	)
	const resolvedProtocol = $derived(
		action.type === ActionType.Swap
			? (swapProtocolIntent !== SwapProtocolId.Auto && swapIdToProtocol[swapProtocolIntent])
				? swapIdToProtocol[swapProtocolIntent]!
				: null
			: (() => {
					const sel = action.protocolSelection ?? action.protocolAction?.protocol ?? ''
					if (!sel) return null
					if (protocolOptions.some((o) => o.id === sel))
						return sel as Protocol
					return (action.protocolAction?.protocol ?? null) as Protocol | null
				})(),
	)
	const protocolValue = $derived(
		action.type === ActionType.Bridge && bridgeParams
			? (bridgeParams.protocolIntent
					? bridgeIdToProtocol[bridgeParams.protocolIntent]
					: action.protocolAction?.protocol ?? '')
			: (action.protocolSelection ?? action.protocolAction?.protocol ?? ''),
	)
	const swapUsesSpandex = $derived(
		action.type === ActionType.Swap &&
			(swapProtocolIntent === SwapProtocolId.Auto ||
				(swapIdToProtocol[swapProtocolIntent] != null &&
					spandexSwapProtocols.includes(swapIdToProtocol[swapProtocolIntent]!))),
	)
	const spandexStrategy = $derived(
		swapProtocolIntent === SwapProtocolId.Auto ? swapStrategy : undefined,
	)
	const paramsHash = $derived(stringify(action.params))
	const isCctpBridge = $derived(
		action.type === ActionType.Bridge &&
			(bridgeParams?.protocolIntent === BridgeProtocolId.Cctp ||
				resolvedProtocol === Protocol.Cctp),
	)

	const filteredNetworks = $derived(
		networks.filter((n) =>
			isTestnet
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
		return def.params.allows(action.params)
	})

	const swapParamsForRequest = $derived.by((): ActionParams<ActionType.Swap> | null => {
		if (action.type !== ActionType.Swap || !selectedActor) return null
		const p = action.params as ActionParams<ActionType.Swap>
		return p.chainId != null && p.tokenIn && p.tokenOut && p.amount > 0n ? p : null
	})
	const swapRequestKey = $derived.by(() => {
		const sp = swapParamsForRequest
		if (!sp || !selectedActor) return ''
		return getRequestKeyForParams(
			{
				chainId: sp.chainId,
				tokenIn: sp.tokenIn,
				tokenOut: sp.tokenOut,
				amountIn: sp.amount,
				slippage: sp.slippage,
			},
			selectedActor,
		)
	})
	const spandexProvider = $derived(
		action.type === ActionType.Swap &&
			swapProtocolIntent !== SwapProtocolId.Auto &&
			resolvedProtocol
			? (protocolToSpandexProvider[resolvedProtocol] ?? null)
			: null,
	)
	const spandexQuotesQuery = useLiveQuery((q) =>
		q
			.from({ row: spandexQuoteItemsCollection })
			.select(({ row }) => ({ row })),
	)
	const spandexQuoteTx = $derived(
		swapRequestKey &&
			spandexQuotesQuery.data &&
			swapUsesSpandex
			? (() => {
					const items = spandexQuotesQuery.data!
						.filter((r) => r.row.$id.requestId === swapRequestKey && r.row.success && r.row.transactionRequest)
						.map((r) => r.row)
					const item = spandexProvider
						? items.find((r) => r.provider === spandexProvider)
						: [...items].sort(
								(a, b) =>
									(b.simulatedOutputAmount ?? 0n) > (a.simulatedOutputAmount ?? 0n)
										? 1
										: -1,
							)[0]
					return item?.transactionRequest
				})()
			: undefined,
	)
	const bridgeParamsForQuote = $derived(
		action.type === ActionType.Bridge &&
		selectedActor &&
		bridgeParams &&
		(bridgeParams.protocolIntent === 'lifi' || resolvedProtocol === Protocol.LiFi) &&
		bridgeParams.fromChainId != null &&
		bridgeParams.toChainId != null &&
		((action.params as { amount?: bigint }).amount ?? 0n) > 0n
			? {
					fromChainId: bridgeParams.fromChainId!,
					toChainId: bridgeParams.toChainId!,
					amount: (action.params as { amount?: bigint }).amount ?? 0n,
					fromAddress: selectedActor,
					slippage: (action.params as { slippage?: number }).slippage ?? 0.005,
				}
			: null,
	)
	const bridgeQuoteRequestKey = $derived(
		bridgeParamsForQuote ? getBridgeQuoteRequestKey(bridgeParamsForQuote) : '',
	)
	const bridgeQuotesQuery = useLiveQuery((q) =>
		q
			.from({ row: bridgeQuoteItemsCollection })
			.select(({ row }) => ({ row })),
	)
	const lifiBridgeTxs = $derived(
		bridgeQuoteRequestKey && bridgeQuotesQuery.data
			? bridgeQuotesQuery.data.find(
					(r) => r.row.$id === bridgeQuoteRequestKey && r.row.success,
				)?.row?.transactionRequests
			: undefined,
	)
	const signingPayloads = $derived(
		resolveSigningPayloads(action, rpcUrls ?? {}, selectedActor, {
			selectedChainId,
			isTestnet,
			spandexQuoteTx,
			lifiBridgeTxs,
		}),
	)
	const proposedTransactionsHeading = $derived(
		new Intl.PluralRules('en').select(signingPayloads.length) === 'one'
			? 'Proposed Transaction'
			: 'Proposed Transactions',
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


	// State
	let broadcastInProgress = $state(false)
	let simulateInProgress = $state(false)
	let cctpConfirmOpen = $state(false)


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
			action.type === ActionType.Bridge && valid ? protocolToBridgeId[value as Protocol] : undefined
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
				indexInSequence,
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
		broadcast()
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


	// Components
	import Select from '$/components/Select.svelte'
	import AddLiquidityFieldset from '$/views/actions/AddLiquidityFieldset.svelte'
	import BridgeFieldset from '$/views/actions/BridgeFieldset.svelte'
	import SwapFieldset from '$/views/actions/SwapFieldset.svelte'
	import TransferFieldset from '$/views/actions/TransferFieldset.svelte'
	import BridgeQuotesPanel from '$/views/actions/BridgeQuotesPanel.svelte'
	import SpandexQuotesPanel from '$/views/actions/SpandexQuotesPanel.svelte'
	import BridgeProtocolFieldset from './BridgeProtocolFieldset.svelte'
	import ProtocolInput from './ProtocolInput.svelte'
	import SwapProtocolFieldset from './SwapProtocolFieldset.svelte'
	import Simulations from './Simulations.svelte'
	import TransactionSigningPayloadList from './TransactionSigningPayloadList.svelte'
	import Transactions from './Transactions.svelte'
</script>


<details
	data-card
	open
>
	<summary data-row="gap-2 justify-between">
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

			{#if action.type === ActionType.Swap && swapUsesSpandex}
				<SpandexQuotesPanel
					params={action.params as ActionParams<ActionType.Swap>}
					provider={spandexProvider ?? undefined}
					strategy={
					spandexStrategy
						? (spandexStrategy as import('$/constants/protocols.ts').ProtocolStrategy)
						: undefined
				}
					swapperAccount={selectedActor}
				/>
			{/if}
			{#if action.type === ActionType.Bridge && (bridgeParams?.protocolIntent === 'lifi' || resolvedProtocol === Protocol.LiFi)}
				<BridgeQuotesPanel
					params={action.params as ActionParams<ActionType.Bridge>}
					fromAddress={selectedActor}
				/>
			{/if}

			<section data-card data-column>
				<h3>{proposedTransactionsHeading}</h3>
				<TransactionSigningPayloadList payloads={signingPayloads} />
				<div data-row>
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
					{#if bridgeParams && selectedActor}
						{@const fromNet = Object.values(networksByChainId).find((n) => n?.chainId === bridgeParams.fromChainId)}
						{@const toNet = Object.values(networksByChainId).find((n) => n?.chainId === bridgeParams.toChainId)}
						{#if fromNet && toNet}
							<Dialog.Description>
								Send {formatSmallestToDecimal((action.params as { amount?: bigint }).amount ?? 0n, 6)} USDC from {fromNet.name}
								to {toNet.name}. Recipient: {formatAddress(selectedActor)}.
							</Dialog.Description>
						{/if}
					{/if}
					<div data-row="gap-2" class="dialog-actions">
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
	.dialog-actions {
		margin-top: 1rem;
	}

	button {
		font-size: 1em;
	}
</style>
