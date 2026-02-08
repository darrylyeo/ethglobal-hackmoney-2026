<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import type { BridgeRoute, BridgeRoutes$Id } from '$/data/BridgeRoute.ts'
	import type { WalletRow } from '$/collections/Wallets.ts'
	import {
		BridgeOverallStatus,
		createInitialStatus,
		type BridgeStatus,
	} from '$/lib/bridge/txStatus.ts'
	import {
		type BridgeSessionParams,
		normalizeBridgeSessionParams,
	} from '$/lib/session/params.ts'
	import { BridgeRouteSort } from '$/state/bridge-settings.svelte.ts'
	import {
		type WalletConnectionEip1193,
		WalletConnectionTransport,
	} from '$/data/WalletConnection.ts'
	import { extractFeeBreakdown, getUsdcAddress } from '$/api/lifi.ts'
	import { getTxReceiptStatus } from '$/api/approval.ts'
	import { ErrorCode } from '$/lib/bridge/errors.ts'
	import {
		extractRouteLimits,
		USDC_MAX_AMOUNT,
		USDC_MIN_AMOUNT,
		validateBridgeAmount,
	} from '$/constants/bridge-limits.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import {
		calculateMinOutput,
		formatSlippagePercent,
		parseSlippagePercent,
		slippagePresets,
	} from '$/constants/slippage.ts'


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { Button, Popover } from 'bits-ui'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Functions
	import { resolve } from '$app/paths'
	import { getTxUrl } from '$/constants/explorers.ts'
	import {
		formatAddress,
		isValidAddress,
		normalizeAddress,
	} from '$/lib/address.ts'
	import { debounce } from '$/lib/debounce.ts'
	import { formatSmallestToDecimal, formatTokenAmount } from '$/lib/format.ts'
	import { formatRelativeTime } from '$/lib/formatRelativeTime.ts'
	import { stringify } from 'devalue'
	import { E2E_TEVM_ENABLED } from '$/tests/tevm.ts'

	const resolveNetwork = (chainId: number | null) =>
		chainId !== null
			? (Object.values(networksByChainId).find(
					(entry) => entry?.id === chainId,
				) ?? null)
			: null
	const resolveNetworkName = (chainId: number) =>
		resolveNetwork(chainId)?.name ?? `Chain ${chainId}`
	const isEip1193Wallet = (
		wallet: ConnectedWallet | null,
	): wallet is { wallet: WalletRow; connection: WalletConnectionEip1193 } =>
		Boolean(
			wallet &&
			wallet.connection.transport === WalletConnectionTransport.Eip1193,
		)


	// State
	import { actorAllowancesCollection } from '$/collections/ActorAllowances.ts'
	import { actorCoinsCollection } from '$/collections/ActorCoins.ts'
	import {
		bridgeRoutesCollection,
		fetchBridgeRoutes,
	} from '$/collections/BridgeRoutes.ts'
	import {
		bridgeTransactionsCollection,
		updateTransaction,
	} from '$/collections/BridgeTransactions.ts'
	import { BridgeTransactionStatus } from '$/data/Transaction.ts'


	// Components
	import Select from '$/components/Select.svelte'
	import Skeleton from '$/components/Skeleton.svelte'
	import Spinner from '$/components/Spinner.svelte'
	import TransactionFlow from '$/views/TransactionFlow.svelte'
	import BridgeExecution from './BridgeExecution.svelte'
	import TokenApproval from './TokenApproval.svelte'


	// Props
	let {
		selectedWallets,
		selectedActor,
		settings = $bindable(normalizeBridgeSessionParams(null)),
		preview = $bindable(null as BridgeRoute | null),
		onExecutionSuccess,
		balanceTokens = $bindable([]),
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
		settings?: BridgeSessionParams
		preview?: BridgeRoute | null
		onExecutionSuccess?: (args: { txHash?: `0x${string}` }) => void
		balanceTokens?: {
			chainId: number
			tokenAddress: `0x${string}`
		}[]
	} = $props()


	// State
	let slippageInput = $state('')
	let invalidAmountInput = $state(false)
	let selectedRouteId = $state<string | null>(null)
	let executing = $state(false)
	let executeFunction = $state<(() => Promise<{ txHash?: `0x${string}` } | void>) | null>(null)
	let executionStatus = $state<BridgeStatus>(createInitialStatus())
	let now = $state(Date.now())


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
	const fromNetwork = $derived(resolveNetwork(settings.fromChainId))
	const toNetwork = $derived(resolveNetwork(settings.toChainId))

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
			.from({ row: bridgeTransactionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.orderBy(({ row }) => row.$id?.createdAt ?? 0, 'desc')
			.select(({ row }) => ({ row })),
	)
	const liveQueryEntries = [
		{
			id: 'bridge-flow-routes',
			label: 'Bridge Routes',
			query: routesQuery,
		},
		{
			id: 'bridge-flow-balances',
			label: 'Balances',
			query: balancesQuery,
		},
		{
			id: 'bridge-flow-allowances',
			label: 'Allowances',
			query: allowancesQuery,
		},
		{
			id: 'bridge-flow-transactions',
			label: 'Transactions',
			query: txQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const validation = $derived(
		validateBridgeAmount(settings.amount, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT),
	)
	const balances = $derived(
		selectedActor
			? (balancesQuery.data ?? [])
					.map((r) => r.row)
					.filter(
						(b) => b.$id.address.toLowerCase() === selectedActor.toLowerCase(),
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
	const exceedsBalance = $derived(
		E2E_TEVM_ENABLED
			? false
			: sourceBalance !== null && settings.amount > sourceBalance,
	)
	const canSendAmount = $derived(
		validation.isValid && !exceedsBalance && !invalidAmountInput,
	)

	const PLACEHOLDER_ADDRESS: `0x${string}` =
		'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
	const quoteAddress = $derived(selectedActor ?? PLACEHOLDER_ADDRESS)
	const quoteParams = $derived<BridgeRoutes$Id | null>(
		fromNetwork && toNetwork && settings.amount > 0n && validation.isValid
			? {
					fromChainId: fromNetwork.id,
					toChainId: toNetwork.id,
					amount: settings.amount,
					fromAddress: quoteAddress,
					slippage: settings.slippage,
				}
			: null,
	)
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
			if (settings.sortBy === BridgeRouteSort.Output)
				return b.toAmount > a.toAmount ? 1 : b.toAmount < a.toAmount ? -1 : 0
			if (settings.sortBy === BridgeRouteSort.Fees)
				return a.gasCostUsd - b.gasCostUsd
			if (settings.sortBy === BridgeRouteSort.Speed)
				return a.estimatedDurationSeconds - b.estimatedDurationSeconds
			return 0
		}),
	)
	const selectedRoute = $derived(
		sortedRoutes.find((r) => r.id === selectedRouteId) ??
			sortedRoutes[0] ??
			null,
	)

	const approvalAddress = $derived(
		selectedRoute?.originalRoute?.steps?.[0]?.estimate?.approvalAddress as
			| `0x${string}`
			| undefined,
	)
	const needsApproval = $derived(
		E2E_TEVM_ENABLED
			? false
			: Boolean(
					approvalAddress?.startsWith('0x') && approvalAddress.length === 42,
				),
	)
	const currentAllowance = $derived(
		selectedActor && fromNetwork && approvalAddress
			? (allowancesQuery.data?.find(
					(r) =>
						r.row.$id.chainId === fromNetwork.id &&
						r.row.$id.address.toLowerCase() === selectedActor.toLowerCase() &&
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
	$effect(() => {
		if (sortedRoutes.length > 0 && !selectedRouteId)
			selectedRouteId = sortedRoutes[0].id
	})
	$effect(() => {
		void quoteParams
		selectedRouteId = null
	})
	$effect(() => {
		preview = selectedRoute
	})
	$effect(() => {
		const list = transactions.filter((tx) => tx.status === 'pending')
		if (list.length === 0) return
		const id = setInterval(() => {
			for (const tx of list) {
				getTxReceiptStatus(tx.fromChainId, tx.$id.sourceTxHash)
					.then((status) => {
						if (status === BridgeTransactionStatus.Failed)
							updateTransaction(tx.$id, {
								status: BridgeTransactionStatus.Failed,
							})
					})
					.catch(() => {})
			}
		}, 5000)
		return () => clearInterval(id)
	})
	$effect(() => {
		const id = setInterval(() => {
			now = Date.now()
		}, 1000)
		return () => clearInterval(id)
	})

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
	const QUOTE_TTL = 60_000
	const quoteExpiry = $derived(
		routesRow?.fetchedAt ? routesRow.fetchedAt + QUOTE_TTL : null,
	)
	const quoteRemaining = $derived(
		quoteExpiry ? Math.max(0, Math.ceil((quoteExpiry - now) / 1000)) : null,
	)
	const quoteExpired = $derived(quoteRemaining !== null && quoteRemaining <= 0)

	const sortOptions: { id: BridgeSessionParams['sortBy']; label: string }[] = [
		{ id: BridgeRouteSort.Recommended, label: 'Recommended' },
		{ id: BridgeRouteSort.Output, label: 'Best output' },
		{ id: BridgeRouteSort.Fees, label: 'Lowest fees' },
		{ id: BridgeRouteSort.Speed, label: 'Fastest' },
	]
	const onRefresh = () => {
		if (quoteParams) fetchBridgeRoutes(quoteParams).catch(() => {})
	}
</script>


	<div aria-live="polite" aria-atomic="true" class="sr-only">
		{#if executionStatus.overall === BridgeOverallStatus.InProgress}
			{@const currentStep =
				executionStatus.steps.find((s) => s.state === 'pending') ??
				executionStatus.steps[executionStatus.steps.length - 1]}
			Transaction in progress. {currentStep?.step ?? 'Sending'}
		{:else if executionStatus.overall === 'completed'}
			Bridge complete. Tokens sent successfully.
		{:else if executionStatus.overall === BridgeOverallStatus.Failed}
			Transaction failed. {executionStatus.steps.find((s) => s.error)?.error ??
				'Unknown error'}
		{/if}
	</div>

	{#if !selectedWallet}
		<p data-muted>Connect a wallet to get routes</p>
	{/if}

	{#if routesRow?.error}
		<div
			data-card
			data-error
			data-error-display
			data-no-routes={
				routesRow.error.code === ErrorCode.NoRoutes ? '' : undefined
			}
			data-column="gap-2"
		>
			<span
				>{routesRow.error.code === ErrorCode.NoRoutes
					? 'No routes available for this transfer.'
					: routesRow.error.message}</span
			>
			{#if routesRow.error.code === ErrorCode.NoRoutes}
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
							bridgeRoutesCollection.update(stringify(quoteParams), (draft) => {
								draft.error = null
							})
					}}
				>
					Dismiss
				</Button.Root>
			</div>
		</div>
	{/if}

	{#if sortedRoutes.length > 0 || routesRow?.isLoading}
		<section
			data-card
			data-column="gap-3"
			data-testid="quote-result"
		>
			<div data-row="gap-2 align-center justify-between">
				<h3>
					Routes {routesRow?.isLoading
						? '(loading…)'
						: `(${sortedRoutes.length})`}
				</h3>
				<label data-row="gap-2 align-center">
					<span>Sort</span>
					<Select
						id="route-sort"
						items={sortOptions}
						bind:value={
							() => settings.sortBy,
							(v) => {
								if (!v) return
								const option = sortOptions.find((entry) => entry.id === v)
								if (!option) return
								settings = { ...settings, sortBy: option.id }
							}
						}
						getItemId={(option) => option.id}
						getItemLabel={(option) => option.label}
					/>
				</label>
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
				{#if routesRow?.isLoading && sortedRoutes.length === 0}
					<p data-muted>Finding routes…</p>
					{#each [1, 2, 3] as _}
						<div
							class="route-card route-card-skeleton"
							data-card="radius-4 padding-3"
							data-column="gap-1"
						>
							<div data-row="gap-2 align-center justify-between">
								<Skeleton width="6em" height="1.25em" rounded="0.25em" />
								<Skeleton width="4em" height="1em" rounded="0.25em" />
							</div>
							<div data-row="gap-2" data-muted>
								<Skeleton width="10em" height="1em" rounded="0.25em" />
								<Skeleton width="3em" height="1em" rounded="0.25em" />
							</div>
						</div>
					{/each}
				{:else}
					{#each sortedRoutes as r (r.id)}
						<button
							class="route-card"
							type="button"
							data-card="radius-4 padding-3"
							data-column="gap-1"
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
				{/if}
			</div>
		</section>
	{/if}

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
					<Button.Root
						onclick={onRefresh}
						disabled={routesRow?.isLoading}
					>
						↻
					</Button.Root>
				</div>
			</div>

			<Popover.Root>
				<Popover.Trigger data-row="gap-1">
					Slippage: <strong>{formatSlippagePercent(settings.slippage)}</strong>
				</Popover.Trigger>
				<Popover.Content data-column="gap-2">
					<div data-row="gap-1">
						{#each slippagePresets as preset (preset.id)}
							<Button.Root
								onclick={() => {
									settings = {
										...settings,
										slippage: preset.value,
									}
								}}
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
							const p = parseSlippagePercent(slippageInput)
							if (p) settings = { ...settings, slippage: p }
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
						route={selectedRoute}
						walletRow={selectedEip1193Wallet}
						bind:status={executionStatus}
						walletAddress={selectedActor}
						fromChainId={fromNetwork.id}
						toChainId={toNetwork.id}
						amount={settings.amount}
						bind:executing
						onExecute={(executeFn) => {
							executeFunction = executeFn
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
							<span class="badge" data-warning> Different recipient </span>
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
					{#if fees}
						<dt>Fees</dt>
						<dd>~${fees.totalUsd}</dd>
					{/if}
				</dl>
				{#if warnDifferentRecipient || warnHighSlippage || warnLargeAmount}
					<div class="warnings" data-column="gap-1">
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
				{onExecutionSuccess}
				Summary={bridgeSummary}
				transactions={[
					{
						id: selectedRoute.id,
						chainId: fromNetwork.id,
						title: 'Bridge',
						actionLabel: executing ? 'Bridging…' : 'Sign and Submit',
						canExecute:
							Boolean(
								selectedWallet &&
								selectedActor &&
								canSend &&
								canSendAmount &&
								!quoteExpired,
							) && !executing,
						execute: (_args) =>
							executeFunction ? executeFunction() : Promise.resolve(),
						requiresConfirmation: true,
						confirmationLabel: 'I understand this transaction is irreversible',
						Details: bridgeDetails,
						Confirmation: bridgeConfirmation,
					},
				]}
			/>
		</section>
	{/if}

	{#if selectedActor}
		<section data-card data-column="gap-2">
			<button class="heading" type="button"> Transaction history </button>
			{#if transactions.length > 0}
				<div data-column="gap-1">
					{#each transactions as tx (stringify(tx.$id))}
						<div class="tx-row" data-row="gap-2 align-center">
							<span data-muted
								>{formatRelativeTime(now - tx.$id.createdAt)}</span
							>
							<span
								>{resolveNetworkName(tx.fromChainId)} → {resolveNetworkName(
									tx.toChainId,
								)}</span
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


<style>
	.route-card {
		background: transparent;
		border: 1px solid var(--color-border);
		cursor: pointer;
		text-align: left;
		width: 100%;

		&:hover {
			border-color: var(--color-primary);
		}

		&[data-selected] {
			border-color: var(--color-primary);
			background: var(--color-info-bg);
		}
	}

	.route-card-skeleton {
		cursor: default;
		pointer-events: none;
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
			background: var(--color-success-bg);
			color: var(--color-success);
		}

		&[data-tag='failed'] {
			background: var(--color-error-bg);
			color: var(--color-error);
		}

		&[data-tag='pending'] {
			background: var(--color-warning-bg);
			color: var(--color-warning);
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
