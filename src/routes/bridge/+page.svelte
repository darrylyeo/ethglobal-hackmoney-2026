<script lang='ts'>
	// Types/constants
	import { browser } from '$app/environment'
	import type { NormalizedRoute } from '$/api/lifi'
	import type { WalletState } from '$/lib/wallet'
	import type { BridgeError } from '$/lib/errors'
	import { NetworkType } from '$/constants/networks'
	import { createWalletState } from '$/lib/wallet'

	// Functions
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { Button, Switch } from 'bits-ui'
	import { networksCollection } from '$/collections/networks'
	import {
		actorCoinsCollection,
		fetchAllBalancesForAddress,
	} from '$/collections/actor-coins'
	import { queryClient } from '$/lib/db/query-client'
	import {
		executeSelectedRoute,
		getRoutesForUsdcBridge,
		getUsdcAddress,
	} from '$/api/lifi'
	import { Select } from 'bits-ui'
	import { createInitialStatus } from '$/lib/tx-status'
	import {
		extractRouteLimits,
		USDC_MIN_AMOUNT,
		USDC_MAX_AMOUNT,
	} from '$/constants/bridge-limits'
	import {
		DEFAULT_SLIPPAGE,
		MIN_SLIPPAGE,
		MAX_SLIPPAGE,
	} from '$/constants/slippage'
	import { getTxUrl } from '$/constants/explorers'
	import { networksByChainId } from '$/constants/networks'
	import { networkStatus } from '$/lib/network-status.svelte'
	import { categorizeError, ErrorCode, isBridgeError } from '$/lib/errors'
	import { toasts } from '$/lib/toast.svelte'
	import { debounce } from '$/lib/debounce'
	import {
		formatTokenAmount,
		parseDecimalToSmallest,
	} from '$/lib/format'
	import { saveTransaction, updateTransactionStatus } from '$/lib/tx-history'

	// Components
	import Skeleton from '$/components/Skeleton.svelte'
	import Spinner from '$/components/Spinner.svelte'
	import ApprovalButton from './ApprovalButton.svelte'
	import ChainIdSection from './ChainIdSection.svelte'
	import ChainSwitchPrompt from './ChainSwitchPrompt.svelte'
	import ConfirmationDialog from './ConfirmationDialog.svelte'
	import ErrorDisplay from './ErrorDisplay.svelte'
	import QuoteForm from './QuoteForm.svelte'
	import QuoteOutput from './QuoteOutput.svelte'
	import RecipientInput from './RecipientInput.svelte'
	import RouteList from './RouteList.svelte'
	import TransactionHistory from './TransactionHistory.svelte'
	import QuoteExpiration from './QuoteExpiration.svelte'
	import SlippageSettings from './SlippageSettings.svelte'
	import TransactionStatus from './TransactionStatus.svelte'
	import WalletProvider from './WalletProvider.svelte'

	// State
	let walletState = $state<WalletState | null>(null)
	const networksQuery = useLiveQuery((q) =>
		q
			.from({ network: networksCollection })
			.orderBy(({ network }) => network.id)
			.select(({ network }) => ({ network })),
	)
	const networks = $derived(
		(networksQuery.data ?? []).map((row) => row.network),
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			(walletState ?? createWalletState()).isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const filteredNetworkItems = $derived(
		filteredNetworks.map((n) => ({ value: String(n.id), label: n.name })),
	)

	const actorCoinsQuery = useLiveQuery((q) =>
		q
			.from({ actorCoin: actorCoinsCollection })
			.orderBy(({ actorCoin }) => actorCoin.chainId)
			.select(({ actorCoin }) => ({ actorCoin })),
	)
	const actorCoins = $derived(
		(actorCoinsQuery.data ?? []).map((row) => row.actorCoin),
	)

	let fromChain = $state(String(1))
	let toChain = $state(String(10))
	let amount = $state('1')
	let recipient = $state<`0x${string}`>(
		'0x0000000000000000000000000000000000000000' as `0x${string}`,
	)
	let routes = $state<NormalizedRoute[]>([])
	let selectedRouteId = $state<string | null>(null)
	let sortBy = $state<'recommended' | 'output' | 'fees' | 'speed'>('recommended')
	let routesError = $state<BridgeError | null>(null)
	let routesRetryAttempt = $state(1)
	let routesLoading = $state(false)
	let execLoading = $state(false)
	let execError = $state<BridgeError | null>(null)
	let execRetryAttempt = $state(1)
	let execTxHashes = $state<string[]>([])
	let bridgeStatus = $state(createInitialStatus())
	let lastFetchedAddress = $state<string | null>(null)
	let lastFetchedChainKey = $state<string | null>(null)
	let approvalComplete = $state(false)
	let showConfirmation = $state(false)
	let routesFetchedAt = $state<number | null>(null)
	let quoteNow = $state(Date.now())
	const SLIPPAGE_STORAGE_KEY = 'bridge-slippage'
	const AUTO_REFRESH_STORAGE_KEY = 'bridge-quote-auto-refresh'
	const initialAutoRefresh = () => {
		if (typeof document === 'undefined') return false
		return localStorage.getItem(AUTO_REFRESH_STORAGE_KEY) === 'true'
	}
	let autoRefreshEnabled = $state(initialAutoRefresh())
	const initialSlippage = () => {
		if (typeof document === 'undefined') return DEFAULT_SLIPPAGE
		const raw = localStorage.getItem(SLIPPAGE_STORAGE_KEY)
		if (raw === null) return DEFAULT_SLIPPAGE
		const num = parseFloat(raw)
		if (
			Number.isNaN(num) ||
			num < MIN_SLIPPAGE ||
			num > MAX_SLIPPAGE
		)
			return DEFAULT_SLIPPAGE
		return num
	}
	let slippage = $state(initialSlippage())
	const QUOTE_VALIDITY_MS = 60_000
	const routesExpiresAt = $derived(
		routesFetchedAt !== null ? routesFetchedAt + QUOTE_VALIDITY_MS : null,
	)
	const quoteIsExpired = $derived(
		routesExpiresAt !== null && quoteNow > routesExpiresAt,
	)

	$effect(() => {
		if (typeof document === 'undefined') return
		localStorage.setItem(SLIPPAGE_STORAGE_KEY, String(slippage))
	})

	$effect(() => {
		if (typeof document === 'undefined') return
		localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, String(autoRefreshEnabled))
	})

	$effect(() => {
		if (
			!autoRefreshEnabled ||
			routesExpiresAt === null ||
			!walletState?.address ||
			routesLoading
		)
			return
		const refreshAt = routesExpiresAt - 5_000
		const delay = refreshAt - Date.now()
		if (delay <= 0) return
		const timeout = setTimeout(() => {
			if (autoRefreshEnabled && !routesLoading && walletState?.address) {
				void getRoutes(walletState)
			}
		}, delay)
		return () => clearTimeout(timeout)
	})

	$effect(() => {
		if (routesFetchedAt === null) return
		const interval = setInterval(() => {
			quoteNow = Date.now()
		}, 1000)
		return () => clearInterval(interval)
	})

	$effect(() => {
		if (walletState?.address) return
		queryClient.removeQueries({ queryKey: ['actorCoins'] })
	})

	const sortedRoutes = $derived(
		[...routes].sort((a, b) => {
			switch (sortBy) {
				case 'output':
					return BigInt(b.toAmount) > BigInt(a.toAmount) ? 1 : -1
				case 'fees':
					return parseFloat(a.gasCostUsd) - parseFloat(b.gasCostUsd)
				case 'speed':
					return a.estimatedDurationSeconds - b.estimatedDurationSeconds
				default:
					return 0
			}
		}),
	)
	const selectedRoute = $derived(
		routes.find((r) => r.id === selectedRouteId) ?? null,
	)
	const approvalAddress = $derived(
		selectedRoute?.originalRoute?.steps?.[0]?.estimate?.approvalAddress as
			| `0x${string}`
			| undefined,
	)
	const needsApprovalCheck = $derived(
		Boolean(
			approvalAddress &&
				approvalAddress.startsWith('0x') &&
				approvalAddress.length === 42,
		),
	)
	const showSendButton = $derived(!needsApprovalCheck || approvalComplete)

	$effect(() => {
		const _ = selectedRoute
		approvalComplete = false
	})

	$effect(() => {
		const filtered = filteredNetworks
		if (filtered.length === 0) return
		const ids = new Set(filtered.map((n) => String(n.id)))
		if (!ids.has(fromChain)) fromChain = String(filtered[0].id)
		const toId = filtered.find((n) => String(n.id) !== fromChain)?.id ?? filtered[0].id
		if (!ids.has(toChain)) toChain = String(toId)
	})

	// Actions
	const fetchBalances = async (
		wallet: WalletState,
		chainIds: number[],
	) => {
		const chainKey = [...chainIds].sort((a, b) => a - b).join(',')
		if (
			!wallet.address ||
			(lastFetchedAddress === wallet.address && lastFetchedChainKey === chainKey)
		)
			return
		lastFetchedAddress = wallet.address
		lastFetchedChainKey = chainKey
		await fetchAllBalancesForAddress(wallet.address, chainIds)
	}

	const getRoutes = async (wallet: WalletState) => {
		if (!wallet.address) return
		routesError = null
		routes = []
		selectedRouteId = null
		routesFetchedAt = null
		routesLoading = true
		try {
			const list = await getRoutesForUsdcBridge({
				fromChain: Number(fromChain),
				toChain: Number(toChain),
				fromAmount: parseDecimalToSmallest(amount, 6).toString(),
				fromAddress: wallet.address,
				toAddress: recipient,
				slippage,
			})
			routes = list
			routesFetchedAt = Date.now()
		} catch (e) {
			routesError = isBridgeError(e) ? e : categorizeError(e)
		} finally {
			routesLoading = false
		}
	}

	const debouncedGetRoutes = debounce((wallet: WalletState) => {
		void getRoutes(wallet)
	}, 500)

	$effect(() => {
		if (
			!walletState?.address ||
			!amount.trim() ||
			!fromChain ||
			!toChain
		)
			return
		debouncedGetRoutes(walletState)
		return () => debouncedGetRoutes.cancel()
	})

	const sendTransaction = async (wallet: WalletState) => {
		if (!wallet.connectedDetail || !wallet.address || !selectedRoute) return
		execError = null
		execTxHashes = []
		execLoading = true
		bridgeStatus = createInitialStatus()
		const loadingId = toasts.loading('Submitting transaction…')
		let savedPendingId: string | null = null
		const fromChainId = Number(fromChain)
		const toChainId = Number(toChain)
		const fromAmountStr = parseDecimalToSmallest(amount, 6).toString()
		try {
			const route = await executeSelectedRoute(
				wallet.connectedDetail,
				selectedRoute,
				(s) => {
					bridgeStatus = s
					const hashes = s.steps
						.map((t) => t.txHash)
						.filter((h): h is string => Boolean(h))
					if (hashes.length > 0) execTxHashes = hashes
					const firstHash = hashes[0]
					if (firstHash && savedPendingId === null) {
						savedPendingId = firstHash
						saveTransaction({
							id: firstHash,
							address: wallet.address,
							fromChainId,
							toChainId,
							fromAmount: fromAmountStr,
							toAmount: selectedRoute.toAmount,
							sourceTxHash: firstHash,
							status: 'pending',
							createdAt: Date.now(),
							updatedAt: Date.now(),
						})
					}
				},
			)
			const processes = route.steps.flatMap(
				(s) => (s.execution?.process ?? []) as { txHash?: string; chainId?: number }[],
			)
			const hashes = processes
				.map((p) => p.txHash)
				.filter((h): h is string => Boolean(h))
			if (hashes.length > 0) execTxHashes = hashes
			toasts.dismiss(loadingId)
			const firstHash = hashes[0]
			const destProcess = processes.find(
				(p) => p.chainId === toChainId && p.txHash,
			)
			const destTxHash = destProcess?.txHash
			if (savedPendingId) {
				updateTransactionStatus(
					wallet.address,
					savedPendingId,
					bridgeStatus.overall === 'failed' ? 'failed' : 'completed',
					destTxHash,
				)
			} else if (firstHash) {
				saveTransaction({
					id: firstHash,
					address: wallet.address,
					fromChainId,
					toChainId,
					fromAmount: fromAmountStr,
					toAmount: selectedRoute.toAmount,
					sourceTxHash: firstHash,
					destTxHash,
					status:
						bridgeStatus.overall === 'failed' ? 'failed' : 'completed',
					createdAt: Date.now(),
					updatedAt: Date.now(),
				})
			}
			if (bridgeStatus.overall === 'completed') {
				toasts.success('Bridge transaction submitted!', {
					title: 'Success',
					...(firstHash
						? {
								action: {
									label: 'View on Explorer',
									onClick: () =>
										window.open(
											getTxUrl(Number(fromChain), firstHash),
											'_blank',
										),
								},
							}
						: {}),
				})
			} else if (bridgeStatus.overall === 'failed') {
				const failedStep = bridgeStatus.steps.find((s) => s.state === 'failed')
				execError = categorizeError(
					new Error(failedStep?.error ?? 'Transaction failed'),
				)
			}
		} catch (e) {
			toasts.dismiss(loadingId)
			if (savedPendingId && wallet.address) {
				updateTransactionStatus(wallet.address, savedPendingId, 'failed')
			}
			const error = isBridgeError(e) ? e : categorizeError(e)
			execError = error
			toasts.error(error.message, {
				title: error.title,
				...(error.retryable
					? {
							action: {
								label: 'Retry',
								onClick: () => sendTransaction(wallet),
							},
						}
					: {}),
			})
		} finally {
			execLoading = false
		}
	}
</script>

<svelte:head>
	<title>USDC Bridge</title>
</svelte:head>

<WalletProvider onStateChange={(s) => (walletState = s)}>
	{#snippet children(wallet)}
		{@const filteredIds = new Set(filteredNetworks.map((n) => n.id))}
		{@const _ = wallet.address
			? fetchBalances(wallet, filteredNetworks.map((n) => n.id))
			: (lastFetchedAddress = null) || (lastFetchedChainKey = null)}
		<div data-column='gap-6'>
			<h1>USDC Bridge</h1>

			{#if wallet.address}
				<section data-card data-column='gap-4' aria-labelledby='balances-heading'>
					<h2 id='balances-heading'>Your USDC Balances</h2>
					{#if actorCoins.filter((ac) => ac.address === wallet.address && filteredIds.has(ac.chainId)).length === 0}
						<div data-balances-grid>
							{#each Array(6) as _, i (i)}
								<div data-balance-item data-loading>
									<Skeleton width="60%" height="0.75em" />
									<Skeleton width="80%" height="1.25em" />
								</div>
							{/each}
						</div>
					{:else}
						<div data-balances-grid>
							{#each actorCoins.filter((ac) => ac.address === wallet.address && filteredIds.has(ac.chainId)) as ac (`${ac.chainId}-${ac.address}-${ac.coinAddress}`)}
								{@const network = networks.find((n) => n.id === ac.chainId)}
								<div data-balance-item data-loading={ac.isLoading ? '' : undefined}>
									<span data-balance-network>{network?.name ?? `Chain ${ac.chainId}`}</span>
									<span data-balance-amount>
										{#if ac.isLoading && ac.balance === 0n}
											<Skeleton width="80px" height="1em" />
										{:else if ac.error}
											<span data-balance-error title={ac.error}>Error</span>
										{:else}
											{ac.balanceFormatted} {ac.coinSymbol}
											{#if ac.isLoading}
												<Spinner size="0.75em" />
											{/if}
										{/if}
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/if}

			<section data-card data-column='gap-4' aria-labelledby='quote-heading'>
				<h2 id='quote-heading'>Get routes</h2>
				<svelte:boundary>
					<div data-bridge-layout>
						<div data-bridge-form data-column='gap-4'>
							{#if !wallet.address}
								<p>Connect a wallet to get routes.</p>
							{:else if networksQuery.isLoading}
								<p>Loading networks…</p>
							{:else}
								{@const sourceBalance = actorCoins.find(
									(ac) =>
										ac.address === wallet.address &&
										ac.chainId === Number(fromChain) &&
										ac.coinSymbol === 'USDC',
								)?.balance ?? null}
								<QuoteForm
									networkItems={filteredNetworkItems}
									bind:fromChain
									bind:toChain
									bind:amount
									fromAddress={wallet.address}
									balance={sourceBalance}
									loading={routesLoading}
									onSubmit={() => getRoutes(wallet)}
								/>
								<RecipientInput
									walletAddress={wallet.address}
									toChainId={Number(toChain)}
									bind:recipient
								/>
								{@const fromChainStatus = networkStatus.getChainStatus(Number(fromChain))}
								{#if fromChainStatus?.status === 'degraded'}
									<p data-chain-warning role="alert">
										⚠️ {networksByChainId[Number(fromChain)]?.name ?? `Chain ${fromChain}`} is experiencing delays
									</p>
								{:else if fromChainStatus?.status === 'down'}
									<p data-chain-error role="alert">
										⛔ {networksByChainId[Number(fromChain)]?.name ?? `Chain ${fromChain}`} is currently unavailable
									</p>
								{/if}
							{/if}
							{#if routesError?.code === ErrorCode.NO_ROUTES}
								<div data-no-routes>
									<p>No routes available for this transfer.</p>
									<ul>
										<li>Try a different amount (min ~1 USDC, max varies by route)</li>
										<li>Try a different chain pair</li>
										<li>Check if the bridge is operational</li>
									</ul>
								</div>
							{:else if routesError}
								<ErrorDisplay
									error={routesError}
									attempt={routesRetryAttempt}
									onRetry={() => {
										routesRetryAttempt++
										getRoutes(wallet)
									}}
									onDismiss={() => {
										routesError = null
									}}
								/>
							{/if}
							{#if wallet.chainId !== null && wallet.chainId !== Number(fromChain) && wallet.connectedDetail}
								<ChainSwitchPrompt
									currentChainId={wallet.chainId}
									requiredChainId={Number(fromChain)}
									provider={wallet.connectedDetail.provider}
									onSwitched={() => {}}
								/>
							{/if}
						</div>
						<div data-bridge-output data-column='gap-4'>
							{#if routes.length > 0 || routesLoading}
								{#if routes.length > 0}
									<div data-column='gap-2'>
										<label for='sort-routes' class='sr-only'>Sort routes</label>
										<Select.Root
											type='single'
											bind:value={sortBy}
											items={[
												{ value: 'recommended', label: 'Recommended' },
												{ value: 'output', label: 'Best output' },
												{ value: 'fees', label: 'Lowest fees' },
												{ value: 'speed', label: 'Fastest' },
											]}
										>
											<Select.Trigger id='sort-routes' aria-label='Sort routes'>
												Sort: {sortBy === 'recommended' ? 'Recommended' : sortBy === 'output' ? 'Best output' : sortBy === 'fees' ? 'Lowest fees' : 'Fastest'}
											</Select.Trigger>
											<Select.Portal>
												<Select.Content>
													<Select.Viewport>
														<Select.Item value='recommended' label='Recommended'>Recommended</Select.Item>
														<Select.Item value='output' label='Best output'>Best output</Select.Item>
														<Select.Item value='fees' label='Lowest fees'>Lowest fees</Select.Item>
														<Select.Item value='speed' label='Fastest'>Fastest</Select.Item>
													</Select.Viewport>
												</Select.Content>
											</Select.Portal>
										</Select.Root>
									</div>
								{/if}
								<RouteList
									routes={sortedRoutes}
									bind:selectedId={selectedRouteId}
									loading={routesLoading}
								/>
							{/if}
							{#if selectedRoute}
								{@const limits = extractRouteLimits([selectedRoute])}
								{@const minDisplay = limits.minAmount ?? USDC_MIN_AMOUNT}
								{@const maxDisplay = limits.maxAmount ?? USDC_MAX_AMOUNT}
								<p data-route-limits>
									Min: {formatTokenAmount(String(minDisplay), 6)} USDC
									Max: {formatTokenAmount(String(maxDisplay), 6)} USDC
								</p>
								{#if routesExpiresAt !== null}
									<div data-quote-expiration-row>
										<QuoteExpiration
											expiresAt={routesExpiresAt}
											onRefresh={() => getRoutes(wallet)}
											isRefreshing={routesLoading}
										/>
										<label data-auto-refresh-toggle>
											<Switch.Root
												checked={autoRefreshEnabled}
												onCheckedChange={(c) => (autoRefreshEnabled = c ?? false)}
												aria-label="Auto-refresh quote before expiry"
											>
												<Switch.Thumb />
											</Switch.Root>
											<span>Auto-refresh before expiry</span>
										</label>
									</div>
								{/if}
								<SlippageSettings bind:value={slippage} />
								<QuoteOutput
									route={selectedRoute}
									slippage={slippage}
									connectedDetail={wallet.connectedDetail}
									execLoading={execLoading}
									execError={execError}
									execRetryAttempt={execRetryAttempt}
									execTxHashes={execTxHashes}
									showSendButton={showSendButton}
									quoteExpired={quoteIsExpired}
									onSendTransaction={() => {
										showConfirmation = true
									}}
									onDismissExecError={() => {
										execError = null
									}}
									onRetryExec={() => {
										execRetryAttempt++
										sendTransaction(wallet)
									}}
								/>
								{#if wallet.address}
									<ConfirmationDialog
										bind:open={showConfirmation}
										route={selectedRoute}
										fromChainId={Number(fromChain)}
										toChainId={Number(toChain)}
										fromAmount={parseDecimalToSmallest(amount, 6).toString()}
										fromAddress={wallet.address}
										toAddress={recipient}
										slippage={slippage}
										onConfirm={() => sendTransaction(wallet)}
										onCancel={() => {}}
									/>
								{/if}
								{#if needsApprovalCheck && !approvalComplete && wallet.connectedDetail && wallet.address}
									<ApprovalButton
										chainId={Number(fromChain)}
										tokenAddress={getUsdcAddress(Number(fromChain))}
										spenderAddress={approvalAddress!}
										amount={parseDecimalToSmallest(amount, 6)}
										walletProvider={wallet.connectedDetail.provider}
										walletAddress={wallet.address}
										onApproved={() => {
											approvalComplete = true
										}}
									/>
								{/if}
								<TransactionStatus
									status={bridgeStatus}
									fromChainId={Number(fromChain)}
									toChainId={Number(toChain)}
								/>
							{/if}
						</div>
					</div>

					{#snippet failed(error, reset)}
						<ErrorDisplay
							error={categorizeError(error)}
							attempt={1}
							onRetry={reset}
						/>
					{/snippet}
				</svelte:boundary>
			</section>

			<ChainIdSection />

			{#if wallet.address}
				<TransactionHistory address={wallet.address} />
			{/if}
		</div>
	{/snippet}
</WalletProvider>


<style>
	[data-balances-grid] {
		display: grid;
		gap: 0.75em;
	}

	[data-balance-item] {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		padding: 0.75em;
		background: var(--color-bg-page);
		border-radius: 0.5em;
		border: 1px solid var(--color-border);
	}

	[data-balance-item][data-loading] {
		opacity: 0.6;
	}

	[data-balance-network] {
		font-size: 0.75em;
		opacity: 0.7;
	}

	[data-balance-amount] {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	[data-balance-error] {
		color: var(--color-error, #ef4444);
		font-size: 0.875em;
	}

	[data-quote-expiration-row] {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75em;
	}

	[data-auto-refresh-toggle] {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		font-size: 0.875em;
		cursor: pointer;
	}
</style>
