<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { WalletConnectionTransport } from '$/data/WalletConnection'
	import { ercTokens, ercTokensBySymbolByChainId } from '$/constants/coins'
	import {
		validateBridgeAmount,
		USDC_MIN_AMOUNT,
		USDC_MAX_AMOUNT,
	} from '$/constants/bridge-limits'
	import {
		CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS,
		CCTP_FORWARDING_CHAIN_IDS,
		getCctpDomainId,
		isCctpSupportedChain,
	} from '$/constants/cctp'
	import {
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { Button, Dialog, Switch } from 'bits-ui'

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
	const walletProvider = $derived(
		selectedWallet?.connection.transport === WalletConnectionTransport.Eip1193
			? (
					selectedWallet.wallet as {
						provider: import('$lib/wallet').EIP1193Provider
					}
				).provider
			: null,
	)

	// Functions
	import { getUsdcAddress } from '$/api/lifi'
	import { formatAddress, isValidAddress } from '$/lib/address'
	import { formatSmallestToDecimal } from '$/lib/format'
	import {
		buildSessionHash,
		createTransactionSession,
		createTransactionSessionWithId,
		forkTransactionSession,
		getTransactionSession,
		lockTransactionSession,
		markTransactionSessionFinalized,
		markTransactionSessionSubmitted,
		parseSessionHash,
		updateTransactionSession,
		updateTransactionSessionParams,
	} from '$/lib/transaction-sessions'

	const resolveNetwork = (chainId: number | null) => (
		chainId !== null ?
			(Object.values(networksByChainId).find(
				(entry) => entry?.id === chainId,
			) ?? null)
		:
			null
	)

	type BridgeSessionParams = BridgeSettings & {
		transferSpeed: 'fast' | 'standard'
		forwardingEnabled: boolean
	}

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
	const toBigInt = (value: unknown, fallback: bigint) => (
		typeof value === 'bigint' ?
			value
		: typeof value === 'number' && Number.isFinite(value) ?
			BigInt(Math.floor(value))
		: typeof value === 'string' && /^\d+$/.test(value) ?
			BigInt(value)
		: fallback
	)
	const toTransferSpeed = (
		value: unknown,
		fallback: BridgeSessionParams['transferSpeed'],
	) => (
		value === 'fast' || value === 'standard' ? value : fallback
	)
	const normalizeBridgeParams = (
		params: Record<string, unknown> | null,
	): BridgeSessionParams => ({
		slippage: toNumber(params?.slippage, defaultBridgeSettings.slippage),
		isTestnet: toBoolean(params?.isTestnet, defaultBridgeSettings.isTestnet),
		sortBy: defaultBridgeSettings.sortBy,
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
		transferSpeed: toTransferSpeed(params?.transferSpeed, 'fast'),
		forwardingEnabled: toBoolean(params?.forwardingEnabled, false),
	})
	const isTxHash = (value: unknown): value is `0x${string}` => (
		typeof value === 'string' && value.startsWith('0x')
	)

	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'
	import {
		type BridgeSettings,
		defaultBridgeSettings,
	} from '$/state/bridge-settings.svelte'

	let activeSessionId = $state<string | null>(null)
	let invalidAmountInput = $state(false)
	let confirmOpen = $state(false)
	let feeFastBps = $state<number | null>(null)
	let feeStandardBps = $state<number | null>(null)
	let executing = $state(false)
	let runExecutionAt = $state(0)

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
	const cctpNetworks = $derived(
		filteredNetworks.filter((n) => isCctpSupportedChain(n.id)),
	)
	const fromNetwork = $derived(
		resolveNetwork(settings.fromChainId),
	)
	const toNetwork = $derived(
		resolveNetwork(settings.toChainId),
	)
	const fromDomain = $derived(getCctpDomainId(settings.fromChainId))
	const toDomain = $derived(getCctpDomainId(settings.toChainId))
	const cctpPairSupported = $derived(fromDomain !== null && toDomain !== null)
	const fastTransferSupported = $derived(
		settings.fromChainId !== null &&
			CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS.has(settings.fromChainId),
	)
	const effectiveTransferSpeed = $derived(
		fastTransferSupported ? settings.transferSpeed : 'standard',
	)
	const forwardingSupported = $derived(
		settings.toChainId !== null &&
			CCTP_FORWARDING_CHAIN_IDS.has(settings.toChainId),
	)
	const validation = $derived(
		validateBridgeAmount(settings.amount, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT),
	)
	const canSendAmount = $derived(validation.isValid && !invalidAmountInput)
	const minFinalityThreshold = $derived(
		effectiveTransferSpeed === 'fast' ? 1000 : 2000,
	)
	const feeBps = $derived(
		effectiveTransferSpeed === 'fast'
			? (feeFastBps ?? feeStandardBps ?? 0)
			: (feeStandardBps ?? feeFastBps ?? 0),
	)
	const apiHost = $derived(
		settings.isTestnet
			? 'https://iris-api-sandbox.circle.com'
			: 'https://iris-api.circle.com',
	)
	const recipient = $derived(
		settings.useCustomRecipient && isValidAddress(settings.customRecipient)
			? (settings.customRecipient as `0x${string}`)
			: selectedActor,
	)
	const expectedReceive = $derived(
		feeBps > 0 && settings.amount > 0n
			? settings.amount - (settings.amount * BigInt(feeBps)) / 10000n
			: settings.amount,
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
		if (cctpNetworks.length === 0) return
		const nextFrom = cctpNetworks.some((n) => n.id === settings.fromChainId)
			? settings.fromChainId
			: (cctpNetworks[0]?.id ?? null)
		const nextTo = cctpNetworks.some((n) => n.id === settings.toChainId)
			? settings.toChainId
			: (cctpNetworks[1]?.id ?? cctpNetworks[0]?.id ?? null)
		if (nextFrom === settings.fromChainId && nextTo === settings.toChainId)
			return
		updateSessionParams({
			...settings,
			fromChainId: nextFrom,
			toChainId: nextTo,
		})
	})

	// Actions
	const onConfirmBridge = () => {
		confirmOpen = true
	}
	const onConfirmSubmit = () => {
		confirmOpen = false
		if (session) {
			lockTransactionSession(session.id)
			markTransactionSessionSubmitted(session.id, {
				submittedAt: Date.now(),
				chainId: settings.fromChainId ?? undefined,
			})
		}
		runExecutionAt = Date.now()
	}
	const onExecutionStatus = (
		step: 'burn' | 'attestation' | 'mint',
		status: 'pending' | 'done' | 'error',
		detail?: string,
	) => {
		if (!session || status !== 'done') return
		if (step === 'burn' && isTxHash(detail)) {
			updateTransactionSession(session.id, (current) => ({
				...current,
				status: 'Submitted',
				lockedAt: current.lockedAt ?? Date.now(),
				execution: {
					submittedAt: current.execution?.submittedAt ?? Date.now(),
					chainId: settings.fromChainId ?? current.execution?.chainId,
					txHash: detail,
				},
				updatedAt: Date.now(),
			}))
			return
		}
		if (step === 'mint') {
			markTransactionSessionFinalized(session.id, { at: Date.now() })
		}
	}

	// Components
	import NetworkInput from '$/views/NetworkInput.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import CctpAllowance from './CctpAllowance.svelte'
	import CctpExecution from './CctpExecution.svelte'
	import CctpFees from './CctpFees.svelte'
</script>

<div class="bridge-layout">
	<section data-card data-column="gap-4">
		<div data-row="gap-2 align-center justify-between">
			<h2>Bridge USDC (CCTP)</h2>
			{#if sessionLocked}
				<Button.Root type="button" onclick={forkSession}>
					New draft
				</Button.Root>
			{/if}
		</div>

		<div data-row="gap-4">
			<div data-column="gap-1" style="flex:1" data-from-chain>
				<label for="from">From</label>
				<NetworkInput
					networks={cctpNetworks}
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
			<div data-column="gap-1" style="flex:1" data-to-chain>
				<label for="to">To</label>
				<NetworkInput
					networks={cctpNetworks}
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

		{#if canSendAmount && recipient && fromNetwork && toNetwork}
			<div data-preview data-column="gap-1">
				<strong>Transfer preview</strong>
				<dl class="bridge-summary">
					<dt>Burn</dt>
					<dd>
						{formatSmallestToDecimal(settings.amount, 6)} USDC on {fromNetwork.name}
					</dd>
					<dt>Receive</dt>
					<dd>
						~{formatSmallestToDecimal(expectedReceive, 6)} USDC on {toNetwork.name}
					</dd>
					<dt>Recipient</dt>
					<dd>{formatAddress(recipient)}</dd>
				</dl>
			</div>
		{/if}
	</section>

	<section data-card data-column="gap-3">
		<h3>CCTP Settings</h3>
		<div data-column="gap-2">
			<strong>Transfer speed</strong>
			<div data-row="gap-2">
				<Button.Root
					type="button"
					disabled={!fastTransferSupported || sessionLocked}
					data-selected={effectiveTransferSpeed === 'fast' ? '' : undefined}
					onclick={() => {
						updateSessionParams({ ...settings, transferSpeed: 'fast' })
					}}
				>
					Fast
				</Button.Root>
				<Button.Root
					type="button"
					data-selected={effectiveTransferSpeed === 'standard' ? '' : undefined}
					disabled={sessionLocked}
					onclick={() => {
						updateSessionParams({ ...settings, transferSpeed: 'standard' })
					}}
				>
					Standard
				</Button.Root>
			</div>
			{#if !fastTransferSupported}
				<small data-muted
					>Fast transfer is not supported for {fromNetwork?.name ??
						'this source chain'}.</small
				>
			{/if}
		</div>

		{#if forwardingSupported}
			<label data-row="gap-2 align-center">
				<Switch.Root
					bind:checked={() => settings.forwardingEnabled, (c) => (
						updateSessionParams({
							...settings,
							forwardingEnabled: c ?? false,
						})
					)}
					disabled={sessionLocked}
				>
					<Switch.Thumb />
				</Switch.Root>
				Use Forwarding Service
			</label>
		{/if}

		<CctpFees
			{fromDomain}
			{toDomain}
			{apiHost}
			bind:fastBps={feeFastBps}
			bind:standardBps={feeStandardBps}
		/>

		<CctpAllowance {fastTransferSupported} {apiHost} />

		<div data-column="gap-2">
			<CctpExecution
				bind:executing
				{walletProvider}
				senderAddress={selectedActor}
				fromChainId={settings.fromChainId}
				toChainId={settings.toChainId}
				amount={settings.amount}
				mintRecipient={recipient ??
					'0x0000000000000000000000000000000000000000'}
				{minFinalityThreshold}
				{feeBps}
				isTestnet={settings.isTestnet}
				runAt={runExecutionAt}
				onStatus={onExecutionStatus}
			/>
			<Button.Root
				type="button"
				disabled={!cctpPairSupported ||
					!canSendAmount ||
					!selectedWallet ||
					!recipient ||
					executing}
				onclick={onConfirmBridge}
			>
				Bridge via CCTP
			</Button.Root>
		</div>
	</section>
</div>

<Dialog.Root bind:open={confirmOpen}>
	<Dialog.Portal>
		<Dialog.Content>
			<Dialog.Title>Confirm CCTP transfer</Dialog.Title>
			{#if fromNetwork && toNetwork && recipient}
				<Dialog.Description>
					Send {formatSmallestToDecimal(settings.amount, 6)} USDC from {fromNetwork.name}
					to {toNetwork.name}. Recipient: {formatAddress(recipient)}.
				</Dialog.Description>
			{/if}
			<div class="dialog-actions">
				<Button.Root
					type="button"
					onclick={() => {
						confirmOpen = false
					}}>Cancel</Button.Root
				>
				<Button.Root type="button" onclick={onConfirmSubmit}
					>Confirm</Button.Root
				>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

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

	.bridge-summary {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25em 1em;

		dt,
		dd {
			margin: 0;
		}

		dt {
			opacity: 0.7;
		}
	}

	.dialog-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}
</style>
