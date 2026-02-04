<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { ercTokens, ercTokensBySymbolByChainId } from '$/constants/coins'
	import {
		validateBridgeAmount,
		USDC_MIN_AMOUNT,
		USDC_MAX_AMOUNT,
	} from '$/constants/bridge-limits'
	import { isCctpSupportedChain } from '$/constants/cctp'
	import {
		ChainId,
		mainnetForTestnet,
		NetworkType,
		networks,
		networksByChainId,
		testnetsForMainnet,
	} from '$/constants/networks'
	import { BridgeRouteSort, type BridgeSettings } from '$/state/bridge-settings.svelte'

	type BridgeSessionParams = BridgeSettings & {
		protocolIntent: 'cctp' | 'lifi' | null
	}

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { Button, Switch } from 'bits-ui'

	// Props
	let {
		selectedWallets,
		selectedActor,
		balanceTokens = $bindable([]),
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
		balanceTokens?: {
			chainId: number
			tokenAddress: `0x${string}`
		}[]
	} = $props()

	// (Derived)
	const selectedWallet = $derived(
		selectedWallets.find((w) => w.connection.selected) ?? null,
	)

	// Functions
	import { getUsdcAddress } from '$/api/lifi'
	import { formatAddress, isValidAddress, normalizeAddress } from '$/lib/address'
	import {
		buildSessionHash,
		createTransactionSession,
		createTransactionSessionWithId,
		forkTransactionSession,
		getTransactionSession,
		parseSessionHash,
		updateTransactionSessionParams,
	} from '$/lib/transaction-sessions'

	const bridgeSortValues = new Set<string>(Object.values(BridgeRouteSort))
	const isBridgeSort = (value: unknown): value is BridgeSettings['sortBy'] => (
		typeof value === 'string' && bridgeSortValues.has(value)
	)
	const toBoolean = (value: unknown, fallback: boolean) => (
		typeof value === 'boolean' ? value : fallback
	)
	const toNumber = (value: unknown, fallback: number) => (
		typeof value === 'number' && Number.isFinite(value) ?
			value
		: typeof value === 'string' &&
			value.trim().length > 0 &&
			Number.isFinite(Number(value)) ?
			Number(value)
		: fallback
	)
	const toNullableNumber = (
		value: unknown,
		fallback: number | null,
	) => (
		typeof value === 'number' && Number.isFinite(value) ?
			value
		: typeof value === 'string' &&
			value.trim().length > 0 &&
			Number.isFinite(Number(value)) ?
			Number(value)
		: value === null ?
			null
		: fallback
	)
	const resolveNetwork = (chainId: number | null) => (
		chainId !== null ?
			(Object.values(networksByChainId).find(
				(entry) => entry?.id === chainId,
			) ?? null)
		:
			null
	)
	const toBigInt = (value: unknown, fallback: bigint) => (
		typeof value === 'bigint' ?
			value
		: typeof value === 'number' && Number.isFinite(value) ?
			BigInt(Math.floor(value))
		: typeof value === 'string' && /^\d+$/.test(value) ?
			BigInt(value)
		: fallback
	)
	const toProtocolIntent = (
		value: unknown,
		fallback: BridgeSessionParams['protocolIntent'],
	) => (
		value === 'cctp' || value === 'lifi' ? value : value === null ? null : fallback
	)
	const normalizeBridgeParams = (
		params: Record<string, unknown> | null,
	): BridgeSessionParams => ({
		slippage: toNumber(params?.slippage, defaultBridgeSettings.slippage),
		isTestnet: toBoolean(params?.isTestnet, defaultBridgeSettings.isTestnet),
		sortBy: isBridgeSort(params?.sortBy)
			? params.sortBy
			: defaultBridgeSettings.sortBy,
		fromChainId: toNullableNumber(
			params?.fromChainId,
			defaultBridgeSettings.fromChainId,
		),
		toChainId: toNullableNumber(
			params?.toChainId,
			defaultBridgeSettings.toChainId,
		),
		amount: toBigInt(params?.amount, defaultBridgeSettings.amount),
		useCustomRecipient: toBoolean(
			params?.useCustomRecipient,
			defaultBridgeSettings.useCustomRecipient,
		),
		customRecipient:
			typeof params?.customRecipient === 'string'
				? params.customRecipient
				: defaultBridgeSettings.customRecipient,
		protocolIntent: toProtocolIntent(params?.protocolIntent, null),
	})
	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'
	import { defaultBridgeSettings } from '$/state/bridge-settings.svelte'

	let activeSessionId = $state<string | null>(null)
	let invalidAmountInput = $state(false)

	// (Derived)
	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, activeSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[() => activeSessionId],
	)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const sessionParams = $derived(
		normalizeBridgeParams(session?.params ?? null),
	)
	const sessionLocked = $derived(Boolean(session?.lockedAt))
	const settings = $derived(sessionParams)
	const usdcToken = $derived(
		settings.fromChainId !== null
			? (ercTokensBySymbolByChainId[settings.fromChainId]?.['USDC'] ??
					ercTokens[0])
			: ercTokens[0],
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			settings.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const fromNetwork = $derived(
		resolveNetwork(settings.fromChainId),
	)
	const toNetwork = $derived(
		resolveNetwork(settings.toChainId),
	)
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
	const activeProtocol = $derived(
		cctpPairSupported && !lifiPairSupported
			? 'cctp'
			: lifiPairSupported && !cctpPairSupported
				? 'lifi'
				: cctpPairSupported && lifiPairSupported
					? (settings.protocolIntent ?? 'cctp')
					: null,
	)
	const protocolReason = $derived(
		!settings.fromChainId || !settings.toChainId
			? 'Select chains to choose a protocol'
				: cctpPairSupported && !lifiPairSupported
					? 'Only CCTP supports this pair'
					: lifiPairSupported && !cctpPairSupported
						? 'Only LI.FI supports this pair'
						: settings.protocolIntent === 'cctp'
							? 'Using CCTP (your preference)'
							: settings.protocolIntent === 'lifi'
								? 'Using LI.FI (your preference)'
								: 'Using CCTP (best route)',
	)
	const recipient = $derived(
		settings.useCustomRecipient
			? normalizeAddress(settings.customRecipient)
			: selectedActor,
	)

	// Actions
	const activateSession = (sessionId: string) => {
		activeSessionId = sessionId
		if (typeof window === 'undefined') return
		const nextHash = buildSessionHash(sessionId)
		const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`
		history.replaceState(history.state, '', nextUrl)
	}
	const updateSessionParams = (nextParams: BridgeSessionParams) => {
		if (!session) return
		if (sessionLocked) {
			activateSession(
				createTransactionSession({
					flows: [...session.flows],
					params: nextParams,
				}).id,
			)
			return
		}
		updateTransactionSessionParams(session.id, nextParams)
	}
	const forkSession = () => {
		if (!session) return
		activateSession(forkTransactionSession(session).id)
	}
	$effect(() => {
		balanceTokens = (
			[
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
		)
	})

	$effect(() => {
		if (typeof window === 'undefined') return
		const handleHash = () => {
			const parsed = parseSessionHash(window.location.hash)
			if (parsed.kind === 'session') {
				if (parsed.sessionId === activeSessionId && session) return
				const existing = getTransactionSession(parsed.sessionId)
				if (existing) {
					activeSessionId = parsed.sessionId
					return
				}
				createTransactionSessionWithId(parsed.sessionId, {
					flows: ['bridge'],
					params: normalizeBridgeParams(null),
				})
				activeSessionId = parsed.sessionId
				return
			}
			activateSession(
				createTransactionSession({
					flows: ['bridge'],
					params: normalizeBridgeParams(
						parsed.kind === 'params' ? parsed.params : null,
					),
				}).id,
			)
		}
		handleHash()
		window.addEventListener('hashchange', handleHash)
		return () => window.removeEventListener('hashchange', handleHash)
	})

	$effect(() => {
		if (filteredNetworks.length === 0) return
		if (
			settings.fromChainId !== null &&
			filteredNetworks.some((n) => n.id === settings.fromChainId)
		)
			return
		const fromNet = resolveNetwork(settings.fromChainId)
		const toNet = resolveNetwork(settings.toChainId)
		const defaultFrom =
			settings.isTestnet
				? (fromNet ? testnetsForMainnet.get(fromNet)?.[0]?.id : undefined) ??
					ChainId.EthereumSepolia
				: (fromNet ? mainnetForTestnet.get(fromNet)?.id : undefined) ??
					ChainId.Ethereum
		const defaultTo =
			settings.isTestnet
				? (toNet ? testnetsForMainnet.get(toNet)?.[0]?.id : undefined) ??
					ChainId.ArcTestnet
				: (toNet ? mainnetForTestnet.get(toNet)?.id : undefined) ??
					ChainId.Optimism
		updateSessionParams({
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

	// Components
	import NetworkInput from '$/views/NetworkInput.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import UnifiedProtocolRouter from './UnifiedProtocolRouter.svelte'
</script>

<div class="bridge-layout">
	<section data-card data-column="gap-4">
		<div data-row="gap-2 align-center justify-between">
			<h2 data-intent-transition="route">Bridge USDC</h2>
			{#if sessionLocked}
				<Button.Root type="button" onclick={forkSession}>
					New draft
				</Button.Root>
			{/if}
		</div>

		<div data-row="gap-4">
			<div
				data-column="gap-1"
				style="flex:1"
				data-from-chain
				data-intent-transition="source"
			>
				<label for="from">From</label>
				<NetworkInput
					networks={filteredNetworks}
					bind:value={() => settings.fromChainId, (v) => (
						typeof v === 'number'
							? updateSessionParams({ ...settings, fromChainId: v })
							: null
					)}
					placeholder="—"
					id="from"
					ariaLabel="From chain"
					disabled={sessionLocked}
				/>
			</div>
			<div
				data-column="gap-1"
				style="flex:1"
				data-to-chain
				data-intent-transition="target"
			>
				<label for="to">To</label>
				<NetworkInput
					networks={filteredNetworks}
					bind:value={() => settings.toChainId, (v) => (
						typeof v === 'number'
							? updateSessionParams({ ...settings, toChainId: v })
							: null
					)}
					placeholder="—"
					id="to"
					ariaLabel="To chain"
					disabled={sessionLocked}
				/>
			</div>
		</div>

		<div data-column="gap-1">
			<label for="amt">Amount</label>
			<CoinAmountInput
				id="amt"
				coins={[usdcToken]}
				coin={usdcToken}
				min={USDC_MIN_AMOUNT}
				max={USDC_MAX_AMOUNT}
				bind:value={() => settings.amount, (nextAmount) => (
					updateSessionParams({ ...settings, amount: nextAmount })
				)}
				disabled={sessionLocked}
				bind:invalid={() => invalidAmountInput, (nextInvalid) => (
					invalidAmountInput = nextInvalid
				)}
			/>
			{#if invalidAmountInput}
				<small data-error
					>Invalid amount (use numbers and up to 6 decimals)</small
				>
			{:else if validation.error === 'too_low'}
				<small data-error>Min {validation.minAmount} USDC</small>
			{:else if validation.error === 'too_high'}
				<small data-error>Max {validation.maxAmount} USDC</small>
			{:else if validation.error === 'invalid'}
				<small data-error>Enter a valid amount</small>
			{/if}
		</div>

		<div data-column="gap-1">
			<label data-row="gap-2 align-center">
				<Switch.Root
					bind:checked={() => settings.useCustomRecipient, (c) => (
						updateSessionParams({
							...settings,
							useCustomRecipient: c ?? false,
						})
					)}
					disabled={sessionLocked}
				>
					<Switch.Thumb />
				</Switch.Root>
				Different recipient
			</label>
			{#if settings.useCustomRecipient}
				<input
					type="text"
					placeholder="0x..."
					value={settings.customRecipient}
					oninput={(e) => {
						updateSessionParams({
							...settings,
							customRecipient: (e.target as HTMLInputElement).value,
						})
					}}
					disabled={sessionLocked}
				/>
				{#if settings.customRecipient && !isValidAddress(settings.customRecipient)}
					<small data-error>Invalid address</small>
				{/if}
			{:else if selectedActor}
				<small data-muted>To: {formatAddress(selectedActor)}</small>
			{:else}
				<small data-muted>To: Connect wallet</small>
			{/if}
		</div>
	</section>

	<UnifiedProtocolRouter
		protocolIntent={settings.protocolIntent}
		onProtocolIntentChange={(next) => (
			updateSessionParams({ ...settings, protocolIntent: next })
		)}
		sessionId={session?.id ?? null}
		disabled={sessionLocked}
		{activeProtocol}
		{protocolReason}
		{cctpPairSupported}
		{lifiPairSupported}
		{selectedWallet}
		{fromNetwork}
		{toNetwork}
		{canSendAmount}
	/>
</div>

<style>
	.bridge-layout {
		display: grid;
		gap: 1.5em;
		grid-template-columns: 1fr;
	}

	@media (min-width: 768px) {
		.bridge-layout {
			grid-template-columns: 1fr 1fr;
			gap: 2em;
		}
	}
</style>
