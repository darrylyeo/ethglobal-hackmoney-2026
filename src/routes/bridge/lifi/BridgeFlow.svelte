<script lang="ts">
	// Types/constants
	import type {
		ConnectedWallet,
		WalletConnectionEip1193,
	} from '$/collections/wallet-connections'
	import type { BridgeRoute, BridgeRoutes$Id } from '$/data/BridgeRoute'
	import type { WalletRow } from '$/collections/wallets'
	import { WalletConnectionTransport } from '$/data/WalletConnection'
	import { ercTokens, ercTokensBySymbolByChainId } from '$/constants/coins'
	import { DataSource } from '$/constants/data-sources'
	import {
		ChainId,
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks'
	import {
		SLIPPAGE_PRESETS,
		formatSlippagePercent,
		parseSlippagePercent,
		calculateMinOutput,
	} from '$/constants/slippage'
	import {
		validateBridgeAmount,
		extractRouteLimits,
		USDC_MIN_AMOUNT,
		USDC_MAX_AMOUNT,
	} from '$/constants/bridge-limits'

	// Context
	import { Button, Popover, Switch } from 'bits-ui'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	// import { liveQueryAttachmentFrom } from '$/svelte/live-query-context.svelte'

	// State
	import {
		type BridgeSettings,
		defaultBridgeSettings,
		bridgeSettingsState,
	} from '$/state/bridge-settings.svelte'

	// Collections
	import {
		bridgeRoutesCollection,
		fetchBridgeRoutes,
	} from '$/collections/bridge-routes'
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import { actorAllowancesCollection } from '$/collections/actor-allowances'
	import {
		transactionsCollection,
		updateTransaction,
	} from '$/collections/transactions'

	// Functions
	import { resolve } from '$app/paths'
	import { extractFeeBreakdown, getUsdcAddress } from '$/api/lifi'
	import { getTxUrl } from '$/constants/explorers'
	import { getTxReceiptStatus } from '$/api/approval'
	import { formatRelativeTime } from '$/lib/formatRelativeTime'
	import type { BridgeStatus } from '$/lib/tx-status'
	import { ErrorCode } from '$/lib/errors'
	import {
		formatTokenAmount,
		formatSmallestToDecimal,
	} from '$/lib/format'
	import {
		isValidAddress,
		normalizeAddress,
		formatAddress,
	} from '$/lib/address'
	import { stringify } from 'devalue'
	import { debounce } from '$/lib/debounce'
	import { networkStatus } from '$/api/network-status.svelte'

	const isEip1193Wallet = (
		wallet: ConnectedWallet | null,
	): wallet is { wallet: WalletRow; connection: WalletConnectionEip1193 } =>
		Boolean(
			wallet &&
				wallet.connection.transport === WalletConnectionTransport.Eip1193,
		)

	// Components
	import NetworkInput from '$/components/NetworkInput.svelte'
	import Select from '$/components/Select.svelte'
	import Spinner from '$/components/Spinner.svelte'
	import CoinAmountInput from '$/components/CoinAmountInput.svelte'
	import TransactionFlow from '$/components/TransactionFlow.svelte'
	import BridgeExecution from './BridgeExecution.svelte'
	import TokenApproval from './TokenApproval.svelte'

	// Props
	let {
		selectedWallets,
		selectedActor,
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
	} = $props()

	// (Derived)
	const selectedWallet = $derived(
		selectedWallets.find((w) => w.connection.selected) ?? null,
	)
	const selectedEip1193Wallet = $derived(
		isEip1193Wallet(selectedWallet) ? selectedWallet.wallet : null,
	)
	const selectedWalletProvider = $derived(
		selectedEip1193Wallet ? selectedEip1193Wallet.provider : null,
	)

	// Queries (reactive)
	const routesQuery = useLiveQuery((q) =>
		q
			.from({ row: bridgeRoutesCollection })
			.where(({ row }) => eq(row.$source, DataSource.LiFi))
			.select(({ row }) => ({ row })),
	)
	const balancesQuery = useLiveQuery((q) =>
		q
			.from({ row: actorCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Voltaire))
			.select(({ row }) => ({ row })),
	)
	const allowancesQuery = useLiveQuery((q) =>
		q
			.from({ row: actorAllowancesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Voltaire))
			.select(({ row }) => ({ row })),
	)
	const txQuery = useLiveQuery((q) =>
		q
			.from({ row: transactionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.orderBy(({ row }) => row.$id?.createdAt ?? 0, 'desc')
			.select(({ row }) => ({ row })),
	)

	// const bridgeLiveQueryEntries = $derived([
	// 	{ id: 'bridge-routes', label: 'Bridge Routes', query: routesQuery },
	// 	{ id: 'bridge-balances', label: 'Balances', query: balancesQuery },
	// 	{ id: 'bridge-allowances', label: 'Allowances', query: allowancesQuery },
	// 	{ id: 'bridge-transactions', label: 'Transactions', query: txQuery },
	// ])
	// const bridgeLiveQuery = liveQueryAttachmentFrom(() => bridgeLiveQueryEntries)

	// Settings (shared persisted state)
	const settings = $derived(
		bridgeSettingsState.current ?? defaultBridgeSettings,
	)
	const usdcToken = $derived(
		settings.fromChainId !== null
			? (ercTokensBySymbolByChainId[settings.fromChainId]?.['USDC'] ??
					ercTokens[0])
			: ercTokens[0],
	)
	const sortOptions: { id: BridgeSettings['sortBy']; label: string }[] = [
		{ id: 'recommended', label: 'Recommended' },
		{ id: 'output', label: 'Best output' },
		{ id: 'fees', label: 'Lowest fees' },
		{ id: 'speed', label: 'Fastest' },
	]

	// Ephemeral UI state (not persisted)
	let slippageInput = $state('')
	let invalidAmountInput = $state(false)
	let selectedRouteId = $state<string | null>(null)
	let executing = $state(false)
	let executionRef = $state<{ execute: () => Promise<void> } | null>(null)
	let executionStatus = $state<BridgeStatus>({ overall: 'idle', steps: [] })

	// Timer for quote expiry
	let now = $state(Date.now())
	$effect(() => {
		const id = setInterval(() => {
			now = Date.now()
		}, 1000)
		return () => clearInterval(id)
	})

	// Poll pending transaction status (spec 011)
	$effect(() => {
		const list = transactions.filter((tx) => tx.status === 'pending')
		if (list.length === 0) return
		const id = setInterval(() => {
			for (const tx of list) {
				getTxReceiptStatus(tx.fromChainId, tx.$id.sourceTxHash)
					.then((status) => {
						if (status === 'failed')
							updateTransaction(tx.$id, { status: 'failed' })
					})
					.catch(() => {})
			}
		}, 5000)
		return () => clearInterval(id)
	})

	// Networks (derived from settings)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			settings.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const fromNetwork = $derived(
		settings.fromChainId !== null
			? networksByChainId[settings.fromChainId]
			: null,
	)
	const toNetwork = $derived(
		settings.toChainId !== null ? networksByChainId[settings.toChainId] : null,
	)

	// Initialize networks when switching testnet/mainnet
	$effect(() => {
		if (filteredNetworks.length === 0) return
		if (
			settings.fromChainId !== null &&
			filteredNetworks.some((n) => n.id === settings.fromChainId)
		)
			return
		const defaultFrom = settings.isTestnet
			? ChainId.EthereumSepolia
			: ChainId.Ethereum
		const defaultTo = settings.isTestnet ? ChainId.ArcTestnet : ChainId.Optimism
		bridgeSettingsState.current = {
			...settings,
			fromChainId:
				filteredNetworks.find((n) => n.id === defaultFrom)?.id ??
				filteredNetworks[0]?.id ??
				null,
			toChainId:
				filteredNetworks.find((n) => n.id === defaultTo)?.id ??
				filteredNetworks[1]?.id ??
				null,
		}
	})

	// Placeholder address for quotes when wallet not connected (vitalik.eth)
	const PLACEHOLDER_ADDRESS: `0x${string}` =
		'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
	const quoteAddress = $derived(selectedActor ?? PLACEHOLDER_ADDRESS)

	// Quote params (use placeholder when disconnected)
	const quoteParams = $derived<BridgeRoutes$Id | null>(
		fromNetwork && toNetwork && settings.amount > 0n
			? {
					fromChainId: fromNetwork.id,
					toChainId: toNetwork.id,
					amount: settings.amount,
					fromAddress: quoteAddress,
					slippage: settings.slippage,
				}
			: null,
	)

	// Routes (reactive from query)
	const routesRow = $derived(
		quoteParams
			? (routesQuery.data?.find(
					(r) =>
						r.row.$id.fromChainId === quoteParams.fromChainId &&
						r.row.$id.toChainId === quoteParams.toChainId &&
						r.row.$id.amount === quoteParams.amount &&
						r.row.$id.fromAddress === quoteParams.fromAddress &&
						r.row.$id.slippage === quoteParams.slippage,
				)?.row ?? null)
			: null,
	)
	const routes = $derived<BridgeRoute[]>(routesRow?.routes ?? [])
	const sortedRoutes = $derived(
		[...routes].sort((a, b) => {
			if (settings.sortBy === 'output')
				return b.toAmount > a.toAmount ? 1 : b.toAmount < a.toAmount ? -1 : 0
			if (settings.sortBy === 'fees') return a.gasCostUsd - b.gasCostUsd
			if (settings.sortBy === 'speed')
				return a.estimatedDurationSeconds - b.estimatedDurationSeconds
			return 0
		}),
	)

	// Auto-select first route, or use manually selected
	$effect(() => {
		if (sortedRoutes.length > 0 && !selectedRouteId)
			selectedRouteId = sortedRoutes[0].id
	})
	const selectedRoute = $derived(
		sortedRoutes.find((r) => r.id === selectedRouteId) ??
			sortedRoutes[0] ??
			null,
	)

	// Reset selection on params change (approval derives from collection automatically)
	$effect(() => {
		void quoteParams
		selectedRouteId = null
	})

	// Balances (reactive from query)
	const balances = $derived(
		selectedActor
			? (balancesQuery.data ?? [])
					.map((r) => r.row)
					.filter(
						(b) => b.$id.address.toLowerCase() === selectedActor!.toLowerCase(),
					)
			: [],
	)
	const sourceBalance = $derived(
		fromNetwork && selectedActor
			? (balances.find(
					(b) =>
						b.$id.chainId === fromNetwork.id &&
						b.$id.tokenAddress.toLowerCase() ===
							getUsdcAddress(fromNetwork.id).toLowerCase(),
				)?.balance ?? null)
			: null,
	)

	// Fetch routes on params change (debounced, depends on isTestnet via quoteParams)
	const fetchRoutes = debounce(() => {
		if (quoteParams) fetchBridgeRoutes(quoteParams).catch(() => {})
	}, 300)
	$effect(() => {
		void settings.isTestnet
		if (quoteParams) {
			fetchRoutes()
			return () => fetchRoutes.cancel()
		}
	})

	// Auto-refresh every 10s (depends on isTestnet via quoteParams)
	const QUOTE_REFRESH_MS = 10_000
	$effect(() => {
		void settings.isTestnet
		if (!quoteParams) return
		const id = setInterval(
			() => fetchBridgeRoutes(quoteParams).catch(() => {}),
			QUOTE_REFRESH_MS,
		)
		return () => clearInterval(id)
	})

	// Quote expiry (60s validity for UI display)
	const QUOTE_TTL = 60_000
	const quoteExpiry = $derived(
		routesRow?.fetchedAt ? routesRow.fetchedAt + QUOTE_TTL : null,
	)
	const quoteRemaining = $derived(
		quoteExpiry ? Math.max(0, Math.ceil((quoteExpiry - now) / 1000)) : null,
	)
	const quoteExpired = $derived(quoteRemaining !== null && quoteRemaining <= 0)

	const validation = $derived(
		validateBridgeAmount(settings.amount, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT),
	)
	const exceedsBalance = $derived(
		sourceBalance !== null && settings.amount > sourceBalance,
	)
	const canSendAmount = $derived(
		validation.isValid && !exceedsBalance && !invalidAmountInput,
	)

	const approvalAddress = $derived(
		selectedRoute?.originalRoute?.steps?.[0]?.estimate?.approvalAddress as
			| `0x${string}`
			| undefined,
	)
	const needsApproval = $derived(
		Boolean(approvalAddress?.startsWith('0x') && approvalAddress.length === 42),
	)

	// Derive approval state from allowances collection
	const currentAllowance = $derived(
		selectedActor && fromNetwork && approvalAddress
			? (allowancesQuery.data?.find(
					(r) =>
						r.row.$id.chainId === fromNetwork.id &&
						r.row.$id.address.toLowerCase() === selectedActor!.toLowerCase() &&
						r.row.$id.tokenAddress.toLowerCase() ===
							getUsdcAddress(fromNetwork.id).toLowerCase() &&
						r.row.$id.spenderAddress.toLowerCase() ===
							approvalAddress.toLowerCase(),
				)?.row.allowance ?? 0n)
			: 0n,
	)
	const approved = $derived(currentAllowance >= settings.amount)

	const canSend = $derived(!needsApproval || approved)

	const recipient = $derived<`0x${string}`>(
		settings.useCustomRecipient && isValidAddress(settings.customRecipient)
			? normalizeAddress(settings.customRecipient)!
			: (selectedActor ?? '0x0000000000000000000000000000000000000000'),
	)
	const output = $derived(selectedRoute?.toAmount ?? 0n)
	const minOutput = $derived(calculateMinOutput(output, settings.slippage))
	const fees = $derived(
		selectedRoute
			? extractFeeBreakdown({
					steps: selectedRoute.originalRoute.steps,
					fromAmountUSD: selectedRoute.originalRoute.fromAmountUSD,
				})
			: null,
	)
	const fromAmountUsd = $derived(
		selectedRoute
			? parseFloat(selectedRoute.originalRoute.fromAmountUSD ?? '0')
			: 0,
	)
	const warnDifferentRecipient = $derived(settings.useCustomRecipient)
	const warnHighSlippage = $derived(settings.slippage > 0.01)
	const warnLargeAmount = $derived(fromAmountUsd > 10_000)

	const transactions = $derived(
		(txQuery.data ?? [])
			.map((r) => r.row)
			.filter(
				(tx) => tx.$id.address.toLowerCase() === selectedActor?.toLowerCase(),
			)
			.slice(0, 50),
	)

	// Handlers

	const onRefresh = () => {
		if (quoteParams) fetchBridgeRoutes(quoteParams).catch(() => {})
	}
</script>

<div data-bridge-layout>
	<div aria-live="polite" aria-atomic="true" class="sr-only">
		{#if executionStatus.overall === 'in_progress'}
			{@const currentStep =
				executionStatus.steps.find((s) => s.state === 'pending') ??
				executionStatus.steps[executionStatus.steps.length - 1]}
			Transaction in progress. {currentStep?.step ?? 'Sending'}
		{:else if executionStatus.overall === 'completed'}
			Bridge complete. Tokens sent successfully.
		{:else if executionStatus.overall === 'failed'}
			Transaction failed. {executionStatus.steps.find((s) => s.error)?.error ??
				'Unknown error'}
		{/if}
	</div>
	<!-- Left column: Form -->
	<section data-bridge-form data-card data-column="gap-4">
		<h2>Bridge USDC</h2>

		<!-- Network selectors -->
		<div data-row="gap-4">
			<div data-column="gap-1" style="flex:1" data-from-chain>
				<label for="from">From</label>
				<NetworkInput
					networks={filteredNetworks}
					value={settings.fromChainId}
					onValueChange={(v) => (
						typeof v === 'number'
							? (bridgeSettingsState.current = {
									...settings,
									fromChainId: v,
								})
							: null
					)}
					placeholder="—"
					id="from"
					ariaLabel="From chain"
				/>
			</div>
			<div data-column="gap-1" style="flex:1" data-to-chain>
				<label for="to">To</label>
				<NetworkInput
					networks={filteredNetworks}
					value={settings.toChainId}
					onValueChange={(v) => (
						typeof v === 'number'
							? (bridgeSettingsState.current = { ...settings, toChainId: v })
							: null
					)}
					placeholder="—"
					id="to"
					ariaLabel="To chain"
				/>
			</div>
		</div>

		{#if settings.fromChainId !== null}
			{@const fromChainStatus = networkStatus.getChainStatus(
				settings.fromChainId,
			)}
			{#if fromChainStatus?.status === 'degraded'}
				<p data-chain-warning>
					⚠️ {fromNetwork?.name ?? `Chain ${settings.fromChainId}`} is experiencing
					delays
				</p>
			{:else if fromChainStatus?.status === 'down'}
				<p data-chain-error>
					⛔ {fromNetwork?.name ?? `Chain ${settings.fromChainId}`} is currently unavailable
				</p>
			{/if}
		{/if}

		<!-- Amount -->
		<div data-column="gap-1" data-form-field>
			<label for="amt">Amount</label>
			<div data-row="gap-2">
				<CoinAmountInput
					id="amt"
					coins={[usdcToken]}
					coin={usdcToken}
					min={USDC_MIN_AMOUNT}
					max={USDC_MAX_AMOUNT}
					value={settings.amount}
					onValueChange={(nextAmount) => {
						bridgeSettingsState.current = { ...settings, amount: nextAmount }
					}}
					onInvalidChange={(nextInvalid) => {
						invalidAmountInput = nextInvalid
					}}
					style="flex:1"
					ariaDescribedby={invalidAmountInput ||
					exceedsBalance ||
					validation.error
						? 'amt-hint amt-error'
						: 'amt-hint'}
					ariaInvalid={invalidAmountInput || validation.error ? true : undefined}
				/>
				{#if sourceBalance !== null}<Button.Root
						type="button"
						onclick={() => {
							bridgeSettingsState.current = {
								...settings,
								amount: sourceBalance,
							}
						}}>Max</Button.Root
					>{/if}
			</div>
			<p id="amt-hint" class="sr-only">Enter the amount of USDC to bridge</p>
			{#if sourceBalance !== null}<small data-muted
					>Balance: {formatSmallestToDecimal(sourceBalance, 6, 4)} USDC</small
				>{/if}
			{#if invalidAmountInput || exceedsBalance || validation.error}
				<p id="amt-error" role="alert" data-error>
					{#if invalidAmountInput}Invalid amount (use numbers and up to 6
						decimals)
					{:else if exceedsBalance}Insufficient balance
					{:else if validation.error === 'too_low'}Min {validation.minAmount} USDC
					{:else if validation.error === 'too_high'}Max {validation.maxAmount} USDC
					{:else if validation.error === 'invalid'}Enter a valid amount{/if}
				</p>
			{/if}
		</div>

		<!-- Recipient -->
		<div data-column="gap-1">
			<label data-row="gap-2 align-center">
				<Switch.Root
					checked={settings.useCustomRecipient}
					onCheckedChange={(c) => {
						bridgeSettingsState.current = { ...settings, useCustomRecipient: c }
					}}><Switch.Thumb /></Switch.Root
				>
				Different recipient
			</label>
			{#if settings.useCustomRecipient}
				<input
					type="text"
					placeholder="0x..."
					value={settings.customRecipient}
					oninput={(e) => {
						bridgeSettingsState.current = {
							...settings,
							customRecipient: (e.target as HTMLInputElement).value,
						}
					}}
				/>
				{#if settings.customRecipient && !isValidAddress(settings.customRecipient)}<small
						data-error>Invalid address</small
					>{/if}
			{:else if selectedActor}
				<small data-muted>To: {formatAddress(selectedActor)}</small>
			{:else}
				<small data-muted>To: Connect wallet</small>
			{/if}
		</div>
	</section>

	<!-- Right column: Routes & Output -->
	<div data-bridge-output data-column="gap-4">
		{#if !selectedWallet}
			<p data-muted>Connect a wallet to get routes</p>
		{/if}
		<!-- Routes error -->
		{#if routesRow?.error}
			<div
				data-card
				data-error
				data-error-display
				data-no-routes={routesRow.error.code === ErrorCode.NO_ROUTES
					? ''
					: undefined}
				data-column="gap-2"
			>
				<span
					>{routesRow.error.code === ErrorCode.NO_ROUTES
						? 'No routes available for this transfer.'
						: routesRow.error.message}</span
				>
				{#if routesRow.error.code === ErrorCode.NO_ROUTES}
					<ul data-no-routes-guidance>
						<li>Try a different amount (min ~1 USDC, max varies by route)</li>
						<li>Try a different chain pair</li>
						<li>Check if the bridge is operational</li>
					</ul>
				{/if}
				<div data-row="gap-2">
					<Button.Root onclick={onRefresh}>Retry</Button.Root>
					<Button.Root
						data-dismiss
						onclick={() => {
							if (quoteParams)
								bridgeRoutesCollection.update(
									stringify(quoteParams),
									(draft) => {
										draft.error = null
									},
								)
						}}
					>
						Dismiss
					</Button.Root>
				</div>
			</div>
		{/if}

		<!-- Routes list -->
		{#if sortedRoutes.length > 0 || routesRow?.isLoading}
			<section data-card data-column="gap-3" data-testid="quote-result">
				{#snippet sortPrefix()}
					Sort:
				{/snippet}

				<div data-row="gap-2 align-center justify-between">
					<h3>
						Routes {routesRow?.isLoading
							? '(loading…)'
							: `(${sortedRoutes.length})`}
					</h3>
					<Select
						items={sortOptions}
						value={settings.sortBy}
						onValueChange={(v) => {
							if (!v) return
							const option = sortOptions.find((entry) => entry.id === v)
							if (!option) return
							bridgeSettingsState.current = { ...settings, sortBy: option.id }
						}}
						getItemId={(option) => option.id}
						getItemLabel={(option) => option.label}
						Before={sortPrefix}
					/>
				</div>

				{#if sortedRoutes.length > 0}
					{@const limits = extractRouteLimits(sortedRoutes)}
					{#if limits.minAmount !== null || limits.maxAmount !== null}
						<p data-route-limits data-muted>
							{#if limits.minAmount !== null}
								Min: {formatSmallestToDecimal(limits.minAmount, 6)} USDC
							{/if}
							{#if limits.maxAmount !== null}
								{#if limits.minAmount !== null}
									·
								{/if}Max: {formatSmallestToDecimal(limits.maxAmount, 6)} USDC
							{/if}
						</p>
					{/if}
				{/if}
				<div data-column="gap-2">
					{#each sortedRoutes as r (r.id)}
						<button
							class="route-card"
							type="button"
							data-selected={r.id === selectedRouteId ? '' : undefined}
							onclick={() => {
								selectedRouteId = r.id
							}}
						>
							<div data-row="gap-2 align-center justify-between">
								<strong>{formatTokenAmount(r.toAmount, 6)} USDC</strong>
								<span data-muted>${r.gasCostUsd.toFixed(2)} fees</span>
							</div>
							<div data-row="gap-2" data-muted>
								<span
									>{[...new Set(r.steps.map((st) => st.toolName))].join(
										' → ',
									)}</span
								>
								<span>~{Math.ceil(r.estimatedDurationSeconds / 60)}m</span>
							</div>
						</button>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Selected route details -->
		{#if selectedRoute && fromNetwork && toNetwork}
			<section data-card data-column="gap-3">
				<div data-row="gap-2 align-center justify-between">
					<h3>Quote Details</h3>
					<div data-row="gap-2 align-center" data-muted>
						{#if routesRow?.isLoading}
							Refreshing…
						{:else if quoteRemaining !== null}
							{quoteExpired ? 'Expired' : `${quoteRemaining}s`}
						{/if}
						<Button.Root onclick={onRefresh} disabled={routesRow?.isLoading}
							>↻</Button.Root
						>
					</div>
				</div>

				<!-- Slippage -->
				<Popover.Root>
					<Popover.Trigger data-row="gap-1"
						>Slippage: <strong
							>{formatSlippagePercent(settings.slippage)}</strong
						></Popover.Trigger
					>
					<Popover.Content data-column="gap-2">
						<div data-row="gap-1">
							{#each SLIPPAGE_PRESETS as p (p)}
								<Button.Root
									onclick={() => {
										bridgeSettingsState.current = { ...settings, slippage: p }
									}}
									data-selected={settings.slippage === p ? '' : undefined}
									>{formatSlippagePercent(p)}</Button.Root
								>
							{/each}
						</div>
						<input
							placeholder="Custom %"
							bind:value={slippageInput}
							onchange={() => {
								const p = parseSlippagePercent(slippageInput)
								if (p)
									bridgeSettingsState.current = { ...settings, slippage: p }
							}}
						/>
					</Popover.Content>
				</Popover.Root>

				{#snippet bridgeSummary()}
					<dl class="summary">
						<dt>You send</dt>
						<dd>
							{formatSmallestToDecimal(settings.amount, 6)} USDC on {fromNetwork.name}
						</dd>
						<dt>You receive</dt>
						<dd>~{formatTokenAmount(output, 6)} USDC on {toNetwork.name}</dd>
						<dt>Min received</dt>
						<dd>{formatTokenAmount(minOutput, 6)} USDC</dd>
						<dt>Recipient</dt>
						<dd>{formatAddress(recipient)}</dd>
						{#if fees}
							<dt>Est. fees</dt>
							<dd>~${fees.totalUsd}</dd>
						{/if}
					</dl>
				{/snippet}

				{#snippet bridgeDetails(_tx: unknown, _state: unknown)}
					{#if needsApproval && !approved && selectedWalletProvider && selectedActor}
						<TokenApproval
							chainId={fromNetwork.id}
							tokenAddress={getUsdcAddress(fromNetwork.id)}
							spenderAddress={approvalAddress!}
							amount={settings.amount}
							provider={selectedWalletProvider}
							ownerAddress={selectedActor}
						/>
					{/if}

					{#if selectedEip1193Wallet && selectedActor}
						<BridgeExecution
							bind:this={executionRef}
							route={selectedRoute}
							walletRow={selectedEip1193Wallet}
							walletAddress={selectedActor}
							fromChainId={fromNetwork.id}
							toChainId={toNetwork.id}
							amount={settings.amount}
							bind:executing
							onStatus={(s) => {
								executionStatus = s
							}}
						/>
					{/if}
				{/snippet}

				{#snippet bridgeConfirmation(_tx: unknown, _state: unknown)}
					<dl class="summary">
						<dt>From</dt>
						<dd>
							{formatSmallestToDecimal(settings.amount, 6)} USDC on {fromNetwork.name}
						</dd>
						<dt>To</dt>
						<dd>
							~{formatTokenAmount(selectedRoute.toAmount, 6)} USDC on {toNetwork.name}
						</dd>
						<dt>Min received</dt>
						<dd>{formatTokenAmount(minOutput, 6)} USDC</dd>
						<dt>Recipient</dt>
						<dd>
							<span>{formatAddress(recipient)}</span>
							{#if warnDifferentRecipient}
								<span
									class="badge"
									data-warning
								>
									Different recipient
								</span>
							{/if}
						</dd>
						<dt>Protocol</dt>
						<dd>
							{[...new Set(selectedRoute.steps.map((st) => st.toolName))].join(
								' → ',
							)}
						</dd>
						<dt>Est. time</dt>
						<dd>
							~{Math.ceil(selectedRoute.estimatedDurationSeconds / 60)} min
						</dd>
						<dt>Slippage</dt>
						<dd>{formatSlippagePercent(settings.slippage)}</dd>
						{#if fees}<dt>Fees</dt>
							<dd>~${fees.totalUsd}</dd>{/if}
					</dl>
					{#if warnDifferentRecipient || warnHighSlippage || warnLargeAmount}
						<div
							class="warnings"
							data-column="gap-1"
						>
							{#if warnDifferentRecipient}
								<p class="warning">Recipient is not your connected wallet.</p>
							{/if}
							{#if warnHighSlippage}
								<p class="warning">
									High slippage ({formatSlippagePercent(settings.slippage)}).
								</p>
							{/if}
							{#if warnLargeAmount}
								<p class="warning">
									Large amount (${fromAmountUsd.toLocaleString()} USD).
								</p>
							{/if}
						</div>
					{/if}
				{/snippet}

				<TransactionFlow
					walletConnection={selectedWallet}
					Summary={bridgeSummary}
					transactions={[
						{
							id: selectedRoute.id,
							chainId: fromNetwork.id,
							title: 'Bridge',
							actionLabel: executing ? 'Bridging…' : 'Send',
							canExecute:
								Boolean(
									selectedWallet &&
									selectedActor &&
									canSend &&
									canSendAmount &&
									!quoteExpired,
								) && !executing,
							execute: (_args) =>
								executionRef ? executionRef.execute() : Promise.resolve(),
							requiresConfirmation: true,
							confirmationLabel:
								'I understand this transaction is irreversible',
							Details: bridgeDetails,
							Confirmation: bridgeConfirmation,
						},
					]}
				/>
			</section>
		{/if}

		<!-- Transaction history (visible when connected per spec 014) -->
		{#if selectedActor}
			<section data-card data-column="gap-2">
				<button
					class="heading"
					type="button"
				>
					Transaction history
				</button>
				{#if transactions.length > 0}
					<div data-column="gap-1">
						{#each transactions as tx (stringify(tx.$id))}
							<div
								class="tx-row"
								data-row="gap-2 align-center"
							>
								<span data-muted
									>{formatRelativeTime(now - tx.$id.createdAt)}</span
								>
								<span
									>{networksByChainId[tx.fromChainId]?.name} → {networksByChainId[
										tx.toChainId
									]?.name}</span
								>
								<span data-tabular
									>{formatSmallestToDecimal(tx.fromAmount, 6)} USDC</span
								>
								<span
									class="tag"
									data-tag={tx.status}
									data-row="gap-1 align-center"
								>
									{#if tx.status === 'pending'}<Spinner size="0.75em" />{/if}
									{tx.status}
								</span>
								<a
									href={resolve(getTxUrl(tx.fromChainId, tx.$id.sourceTxHash))}
									target="_blank"
									rel="noopener noreferrer"
									aria-label="Source tx">↗</a
								>
								{#if tx.destTxHash}
									<a
										href={resolve(getTxUrl(tx.toChainId, tx.destTxHash))}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="Dest tx">↗</a
									>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p data-muted>No transactions yet</p>
				{/if}
			</section>
		{/if}
	</div>
</div>

<style>
	.summary {
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

	.route-card {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		padding: 0.75em;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 0.5em;
		background: transparent;
		cursor: pointer;
		text-align: left;
		width: 100%;

		&:hover {
			border-color: var(--color-primary, #3b82f6);
		}

		&[data-selected] {
			border-color: var(--color-primary, #3b82f6);
			background: var(--color-primary-bg, #eff6ff);
		}
	}

	.heading {
		font: inherit;
		font-weight: 600;
		margin: 0;
		padding: 0;
		background: none;
		border: none;
		cursor: default;
	}

	.tx-row {
		font-size: 0.875em;
	}

	.tag {
		font-size: 0.75em;
		padding: 0.125em 0.5em;
		border-radius: 0.25em;

		&[data-tag='completed'] {
			background: #dcfce7;
			color: #22c55e;
		}

		&[data-tag='failed'] {
			background: #fee2e2;
			color: #ef4444;
		}

		&[data-tag='pending'] {
			background: #fef3c7;
			color: #f59e0b;
		}
	}

	:global([data-tabular]) {
		font-variant-numeric: tabular-nums;
	}

	.warning {
		color: var(--color-warning);
		font-size: 0.875em;
	}

	.badge {
		&[data-warning] {
			display: inline-block;
			margin-left: 0.5em;
			padding: 0.125em 0.5em;
			border-radius: 0.25em;
			background: var(--color-warning-bg);
			color: var(--color-warning);
			font-size: 0.75em;
		}
	}

	.warnings {
		> .warning {
			margin: 0;
		}
	}
</style>
