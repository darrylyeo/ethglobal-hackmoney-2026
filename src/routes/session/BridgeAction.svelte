<script lang="ts">


	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections.ts'
	import type { BridgeRoute } from '$/data/BridgeRoute.ts'
	import type { BridgeSessionParams } from '$/lib/session/params.ts'
	import { getUsdcAddress } from '$/api/lifi.ts'
	import {
		calculateMinOutput,
		formatSlippagePercent,
		parseSlippagePercent,
		slippagePresets,
	} from '$/constants/slippage.ts'
	import {
		USDC_MAX_AMOUNT,
		USDC_MIN_AMOUNT,
		validateBridgeAmount,
	} from '$/constants/bridge-limits.ts'
	import { isCctpSupportedChain } from '$/constants/cctp.ts'
	import { isGatewaySupportedChain } from '$/constants/gateway.ts'
	import { ercTokens, ercTokensBySymbolByChainId } from '$/constants/coins.ts'
	import {
		ChainId,
		mainnetForTestnet,
		NetworkType,
		networks,
		networksByChainId,
		testnetsForMainnet,
	} from '$/constants/networks.ts'


	// Context
	import { getContext } from 'svelte'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { Button, Switch } from 'bits-ui'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'
	import {
		getEffectiveHash,
		setEffectiveHash,
		SESSION_HASH_SOURCE_KEY,
	} from '$/lib/session/panel-hash.ts'


	// Functions
	import { isValidAddress, normalizeAddress } from '$/lib/address.ts'
	import {
		buildSessionHash,
		createSessionId,
		createTransactionSessionSimulation,
		createTransactionSessionWithId,
		parseSessionHash,
		updateTransactionSession,
	} from '$/lib/session/sessions.ts'
	import { normalizeBridgeSessionParams } from '$/lib/session/params.ts'
	import { stringify } from '$/lib/stringify.ts'


	// State
	import { bridgeSettingsState } from '$/state/bridge-settings.svelte'
	import { transactionSessionsCollection } from '$/collections/transaction-sessions.ts'


	// Components
	import Address from '$/components/Address.svelte'
	import LoadingButton from '$/components/LoadingButton.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import SessionAction from '$/views/SessionAction.svelte'
	import UnifiedProtocolRouter from './UnifiedProtocolRouter.svelte'
	import CctpBridgeFlow from '$/routes/bridge/cctp/CctpBridgeFlow.svelte'
	import GatewayBridgeFlow from '$/routes/bridge/gateway/GatewayBridgeFlow.svelte'
	import BridgeFlow from '$/routes/bridge/lifi/BridgeFlow.svelte'


	// Props
	let {
		selectedWallets,
		selectedActor,
		globalIsTestnet = false,
		balanceTokens = $bindable([]),
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
		globalIsTestnet?: boolean
		balanceTokens?: {
			chainId: number
			tokenAddress: `0x${string}`
		}[]
	} = $props()

	const resolveNetwork = (chainId: number | null) =>
		chainId !== null
			? (Object.values(networksByChainId).find(
					(entry) => entry?.id === chainId,
				) ?? null)
			: null


	// State
	let activeSessionId = $state<string | null>(null)
	let pendingSessionId = $state<string | null>(null)
	let lookupSessionId = $state<string | null>(null)
	let invalidAmountInput = $state(false)
	let slippageInput = $state('')
	let localParams = $state<BridgeSessionParams | null>(null)
	let previewResult = $state<BridgeRoute | null>(null)


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
			id: 'session-unified-bridge-session',
			label: 'Session',
			query: sessionQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const sessionLocked = $derived(Boolean(session?.lockedAt))
	const bridgeDefaults = $derived({
		...bridgeSettingsState.current,
		protocolIntent: null as BridgeSessionParams['protocolIntent'],
		transferSpeed: 'fast' as const,
		forwardingEnabled: false,
	})
	const fallbackParams = $derived(
		normalizeBridgeSessionParams(null, bridgeDefaults),
	)
	const settings = $derived(localParams ?? fallbackParams)
	let useGlobalNetworkType = $state(true)
	const effectiveIsTestnet = $derived(
		useGlobalNetworkType ? globalIsTestnet : settings.isTestnet,
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			effectiveIsTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const selectedWallet = $derived(
		selectedWallets.find((w) => w.connection.selected) ?? null,
	)
	const fromNetwork = $derived(resolveNetwork(settings.fromChainId))
	const toNetwork = $derived(resolveNetwork(settings.toChainId))
	const validation = $derived(
		validateBridgeAmount(settings.amount, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT),
	)
	const canSendAmount = $derived(validation.isValid && !invalidAmountInput)
	const cctpPairSupported = $derived(
		isCctpSupportedChain(settings.fromChainId) &&
			isCctpSupportedChain(settings.toChainId),
	)
	const lifiPairSupported = $derived(
		settings.fromChainId !== null && settings.toChainId !== null,
	)
	const gatewayPairSupported = $derived(
		settings.fromChainId !== null &&
			settings.toChainId !== null &&
			isGatewaySupportedChain(settings.fromChainId, effectiveIsTestnet) &&
			isGatewaySupportedChain(settings.toChainId, effectiveIsTestnet),
	)
	const activeProtocol = $derived(
		cctpPairSupported && !lifiPairSupported && !gatewayPairSupported
			? 'cctp'
			: lifiPairSupported && !cctpPairSupported && !gatewayPairSupported
				? 'lifi'
				: gatewayPairSupported && !cctpPairSupported && !lifiPairSupported
					? 'gateway'
					: cctpPairSupported || lifiPairSupported || gatewayPairSupported
						? (settings.protocolIntent ??
								(cctpPairSupported
									? 'cctp'
									: gatewayPairSupported
										? 'gateway'
										: 'lifi'))
						: null,
	)
	const protocolReason = $derived(
		!settings.fromChainId || !settings.toChainId
			? 'Select chains to choose a protocol'
			: cctpPairSupported && !lifiPairSupported && !gatewayPairSupported
				? 'Only CCTP supports this pair'
				: lifiPairSupported && !cctpPairSupported && !gatewayPairSupported
					? 'Only LI.FI supports this pair'
					: gatewayPairSupported && !cctpPairSupported && !lifiPairSupported
						? 'Only Gateway supports this pair'
						: settings.protocolIntent === 'cctp'
							? 'Using CCTP (your preference)'
							: settings.protocolIntent === 'lifi'
								? 'Using LI.FI (your preference)'
								: settings.protocolIntent === 'gateway'
									? 'Using Gateway (your preference)'
									: 'Using CCTP (best route)',
	)
	const recipient = $derived(
		settings.useCustomRecipient
			? normalizeAddress(settings.customRecipient)
			: selectedActor,
	)
	const usdcToken = $derived(
		settings.fromChainId !== null
			? (ercTokensBySymbolByChainId[settings.fromChainId]?.['USDC'] ??
					ercTokens[0])
			: ercTokens[0],
	)
	const minOutput = $derived(
		previewResult
			? calculateMinOutput(previewResult.toAmount, settings.slippage)
			: null,
	)
	const previewAvailable = $derived(
		Boolean(activeProtocol === 'lifi' ? previewResult : recipient),
	)
	const hashSource = getContext<
		import('$/lib/session/panel-hash.ts').SessionHashSource
	>(SESSION_HASH_SOURCE_KEY)
	const effectiveHash = $derived(getEffectiveHash(hashSource))

	const updateParams = (nextParams: BridgeSessionParams) => {
		if (localParams && stringify(localParams) === stringify(nextParams)) return
		localParams = nextParams
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
		setActiveSessionId(sessionId)
		setPendingSessionId(null)
		setEffectiveHash(hashSource, buildSessionHash(sessionId))
	}
	const persistDraft = () => {
		const nextParams = normalizeBridgeSessionParams(settings)
		const current = session
		const shouldCreate = !current || current.lockedAt
		const sessionId = shouldCreate
			? (pendingSessionId ?? createSessionId())
			: current.id
		if (shouldCreate) {
			createTransactionSessionWithId(sessionId, {
				actions: ['bridge'],
				params: nextParams,
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
		const nextParams = normalizeBridgeSessionParams(settings)
		const current = session
		const shouldCreate = !current || current.lockedAt
		const sessionId = shouldCreate
			? (pendingSessionId ?? createSessionId())
			: current.id
		if (shouldCreate) {
			createTransactionSessionWithId(sessionId, {
				actions: ['bridge'],
				params: nextParams,
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
	const persistExecution = (args: {
		txHash?: `0x${string}`
		chainId?: number
	}) => {
		const nextParams = normalizeBridgeSessionParams(settings)
		const current = session
		const shouldCreate = !current || current.lockedAt
		const sessionId = shouldCreate
			? (pendingSessionId ?? createSessionId())
			: current.id
		if (shouldCreate) {
			createTransactionSessionWithId(sessionId, {
				actions: ['bridge'],
				params: nextParams,
			})
		}
		updateTransactionSession(sessionId, (session) => ({
			...session,
			params: nextParams,
			status: 'Submitted',
			lockedAt: session.lockedAt ?? Date.now(),
			execution: {
				submittedAt: session.execution?.submittedAt ?? Date.now(),
				chainId: args.chainId ?? session.execution?.chainId,
				txHash: args.txHash ?? session.execution?.txHash,
			},
			updatedAt: Date.now(),
		}))
		setSessionHash(sessionId)
	}

	const onSubmit = (event: SubmitEvent) => {
		event.preventDefault()
		const form = event.currentTarget
		if (!(form instanceof HTMLFormElement)) return
		const intent = new FormData(form).get('intent')
		if (intent === 'save') persistDraft()
		if (intent === 'simulate' && previewAvailable) {
			const result =
				activeProtocol === 'lifi'
					? previewResult
					: {
							amount: settings.amount,
							fromChainId: settings.fromChainId,
							toChainId: settings.toChainId,
							recipient: recipient ?? null,
							transferSpeed: settings.transferSpeed,
							forwardingEnabled: settings.forwardingEnabled,
						}
			if (result) persistSimulation(result)
		}
	}

	$effect(() => {
		if (!localParams)
			updateParams(normalizeBridgeSessionParams(null, bridgeDefaults))
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
		useGlobalNetworkType = true
		setActiveSessionId(null)
		setPendingSessionId(null)
		updateParams(
			normalizeBridgeSessionParams(
				parsed.kind === 'actions' ? (parsed.actions[0]?.params ?? null) : null,
				bridgeDefaults,
			),
		)
	})
	$effect(() => {
		if (!lookupSessionId || !lookupSessionQuery.isReady) return
		const existing = lookupSession
		if (existing) {
			useGlobalNetworkType = false
			setActiveSessionId(lookupSessionId)
			setPendingSessionId(null)
			updateParams(normalizeBridgeSessionParams(existing.params ?? null))
		} else {
			useGlobalNetworkType = true
			setActiveSessionId(null)
			setPendingSessionId(lookupSessionId)
			updateParams(normalizeBridgeSessionParams(null, bridgeDefaults))
		}
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
			useGlobalNetworkType = true
			setActiveSessionId(null)
			setPendingSessionId(null)
			updateParams(
				normalizeBridgeSessionParams(
					parsed.kind === 'actions'
						? (parsed.actions[0]?.params ?? null)
						: null,
					bridgeDefaults,
				),
			)
		}
		handleHash()
		window.addEventListener('hashchange', handleHash)
		return () => window.removeEventListener('hashchange', handleHash)
	})

	$effect(() => {
		const isTestnet = useGlobalNetworkType
			? globalIsTestnet
			: settings.isTestnet
		if (filteredNetworks.length === 0) return
		if (
			settings.fromChainId !== null &&
			filteredNetworks.some((n) => n.id === settings.fromChainId)
		)
			return
		const fromNet = resolveNetwork(settings.fromChainId)
		const toNet = resolveNetwork(settings.toChainId)
		const defaultFrom = isTestnet
			? ((fromNet ? testnetsForMainnet.get(fromNet)?.[0]?.id : undefined) ??
				ChainId.EthereumSepolia)
			: ((fromNet ? mainnetForTestnet.get(fromNet)?.id : undefined) ??
				ChainId.Ethereum)
		const defaultTo = isTestnet
			? ((toNet ? testnetsForMainnet.get(toNet)?.[0]?.id : undefined) ??
				ChainId.ArcTestnet)
			: ((toNet ? mainnetForTestnet.get(toNet)?.id : undefined) ??
				ChainId.Optimism)
		updateParams({
			...settings,
			fromChainId:
				filteredNetworks.find((n) => n.id === defaultFrom)?.id ??
				filteredNetworks[0]?.id ??
				null,
			toChainId:
				filteredNetworks.find((n) => n.id === defaultTo)?.id ??
				filteredNetworks[1]?.id ??
				null,
		})
	})

	$effect(() => {
		balanceTokens = [
			settings.fromChainId !== null
				? {
						chainId: settings.fromChainId,
						tokenAddress: getUsdcAddress(settings.fromChainId),
					}
				: null,
			settings.toChainId !== null
				? {
						chainId: settings.toChainId,
						tokenAddress: getUsdcAddress(settings.toChainId),
					}
				: null,
		].flatMap((token) => (token ? [token] : []))
	})
</script>


<SessionAction
		title="Bridge"
		description={sessionLocked ? 'Last saved session is locked.' : undefined}
		onsubmit={onSubmit}
	>
		{#snippet Params()}
			<div data-row="gap-4">
				<div data-column="gap-1" style="flex:1" data-from-chain>
					<label for="from">From</label>
					<NetworkInput
						networks={filteredNetworks}
						bind:value={
							() => settings.fromChainId,
							(v) =>
								typeof v === 'number'
									? updateParams({ ...settings, fromChainId: v })
									: null
						}
						placeholder="—"
						id="from"
						ariaLabel="From chain"
					/>
				</div>
				<div data-column="gap-1" style="flex:1" data-to-chain>
					<label for="to">To</label>
					<NetworkInput
						networks={filteredNetworks}
						bind:value={
							() => settings.toChainId,
							(v) =>
								typeof v === 'number'
									? updateParams({ ...settings, toChainId: v })
									: null
						}
						placeholder="—"
						id="to"
						ariaLabel="To chain"
					/>
				</div>
			</div>

			<div data-column="gap-1">
				<label for="amt">Amount</label>
				<p id="amt-hint" class="sr-only">Enter the amount of USDC to bridge</p>
				<CoinAmountInput
					id="amt"
					coins={[usdcToken]}
					coin={usdcToken}
					min={USDC_MIN_AMOUNT}
					max={USDC_MAX_AMOUNT}
					bind:value={
						() => settings.amount,
						(nextAmount) => updateParams({ ...settings, amount: nextAmount })
					}
					bind:invalid={
						() => invalidAmountInput,
						(nextInvalid) => (invalidAmountInput = nextInvalid)
					}
					ariaDescribedby={invalidAmountInput || validation.error
						? 'amt-hint amt-error'
						: 'amt-hint'}
					ariaInvalid={invalidAmountInput || !!validation.error}
				/>
				{#if invalidAmountInput}
					<small id="amt-error" data-error role="alert"
						>Invalid amount (use numbers and up to 6 decimals)</small
					>
				{:else if validation.error === 'too_low'}
					<small id="amt-error" data-error role="alert"
						>Min {validation.minAmount} USDC</small
					>
				{:else if validation.error === 'too_high'}
					<small id="amt-error" data-error role="alert"
						>Max {validation.maxAmount} USDC</small
					>
				{:else if validation.error === 'invalid'}
					<small id="amt-error" data-error role="alert"
						>Enter a valid amount</small
					>
				{/if}
			</div>

			<div data-column="gap-1">
				<label data-row="gap-2 align-center">
					<Switch.Root
						bind:checked={
							() => settings.useCustomRecipient,
							(c) =>
								updateParams({
									...settings,
									useCustomRecipient: c ?? false,
								})
						}
					>
						<Switch.Thumb />
					</Switch.Root>
					Different recipient
				</label>
				{#if settings.useCustomRecipient}
					<input
						type="text"
						placeholder="0x..."
						bind:value={() => settings.customRecipient, (v) =>
							updateParams({ ...settings, customRecipient: v })}
					/>
					{#if settings.customRecipient && !isValidAddress(settings.customRecipient)}
						<small data-error>Invalid address</small>
					{/if}
				{:else if selectedActor && settings.fromChainId !== null}
					<small data-muted>To: <Address network={settings.fromChainId} address={selectedActor} /></small>
				{:else}
					<small data-muted>To: Connect wallet</small>
				{/if}
			</div>
		{/snippet}

		{#snippet Protocol()}
			<UnifiedProtocolRouter
				bind:protocolIntent={() => settings.protocolIntent, (next) =>
					updateParams({ ...settings, protocolIntent: next })}
				{activeProtocol}
				{protocolReason}
				{cctpPairSupported}
				{lifiPairSupported}
				{gatewayPairSupported}
				{selectedWallet}
				{fromNetwork}
				{toNetwork}
				{canSendAmount}
			/>

			{#if activeProtocol}
				<div data-card data-column="gap-2">
					<h3>Settings</h3>
					{#if activeProtocol === 'lifi'}
						<div data-row="gap-1">
							{#each slippagePresets as preset (preset.id)}
								<Button.Root
									type="button"
									onclick={() =>
										updateParams({ ...settings, slippage: preset.value })}
									data-selected={settings.slippage === preset.value
										? ''
										: undefined}
								>
									{formatSlippagePercent(preset.value)}
								</Button.Root>
							{/each}
						</div>
						<input
							placeholder="Custom %"
							bind:value={slippageInput}
							onchange={() => {
								const nextSlippage = parseSlippagePercent(slippageInput)
								if (nextSlippage !== null)
									updateParams({ ...settings, slippage: nextSlippage })
							}}
						/>
					{:else if activeProtocol === 'cctp'}
						<div data-row="gap-2">
							<Button.Root
								type="button"
								data-selected={settings.transferSpeed === 'fast' ? '' : undefined}
								onclick={() =>
									updateParams({ ...settings, transferSpeed: 'fast' })}
							>
								Fast
							</Button.Root>
							<Button.Root
								type="button"
								data-selected={settings.transferSpeed === 'standard'
									? ''
									: undefined}
								onclick={() =>
									updateParams({ ...settings, transferSpeed: 'standard' })}
							>
								Standard
							</Button.Root>
						</div>
						<label data-row="gap-2 align-center">
							<Switch.Root
								bind:checked={
									() => settings.forwardingEnabled,
									(c) =>
										updateParams({ ...settings, forwardingEnabled: c ?? false })
								}
							>
								<Switch.Thumb />
							</Switch.Root>
							Use Forwarding Service
						</label>
					{/if}
				</div>
			{/if}
		{/snippet}

		{#snippet Preview()}
			<div data-row="gap-2 align-center wrap">
				<LoadingButton type="submit" name="intent" value="save">
					Save Draft
				</LoadingButton>
				<LoadingButton
					type="submit"
					name="intent"
					value="simulate"
					disabled={!previewAvailable}
				>
					Simulate
				</LoadingButton>
			</div>

			{#if activeProtocol === 'lifi'}
				<BridgeFlow
					{selectedWallets}
					{selectedActor}
					bind:settings={() => settings, updateParams}
					bind:preview={previewResult}
					onExecutionSuccess={({ txHash }) =>
						persistExecution({
							txHash,
							chainId: settings.fromChainId ?? undefined,
						})}
					bind:balanceTokens
				/>
			{:else if activeProtocol === 'cctp'}
				<CctpBridgeFlow
					{selectedWallets}
					{selectedActor}
					{settings}
					onExecutionSuccess={({ txHash }) =>
						persistExecution({
							txHash,
							chainId: settings.fromChainId ?? undefined,
						})}
					{recipient}
					{minOutput}
					bind:balanceTokens
				/>
			{:else if activeProtocol === 'gateway'}
				<GatewayBridgeFlow
					{selectedWallets}
					{selectedActor}
					{settings}
					{recipient}
					onExecutionSuccess={({ txHash }) =>
						persistExecution({
							txHash,
							chainId: settings.fromChainId ?? undefined,
						})}
					bind:balanceTokens
				/>
			{/if}
		{/snippet}
	</SessionAction>
