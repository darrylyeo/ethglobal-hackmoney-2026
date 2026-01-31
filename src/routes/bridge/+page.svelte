<script lang="ts">
	// Types/constants
	import { browser } from '$app/environment'
	import { tick } from 'svelte'
	import type { NormalizedRoute } from '$/api/lifi'
	import type { BridgeError } from '$/lib/errors'
	import type { WalletState } from '$/lib/wallet'
	import { ChainId, NetworkType, type Network } from '$/constants/networks'
	import { createWalletState } from '$/lib/wallet'

	const QUOTE_VALIDITY_MS = 60_000
	const ROUTES_REQUEST_TIMEOUT_MS = 20_000
	const DEFAULT_MAINNET_FROM = String(ChainId.Ethereum)
	const DEFAULT_MAINNET_TO = String(ChainId.Optimism)
	const DEFAULT_TESTNET_FROM = String(ChainId.EthereumSepolia)
	const DEFAULT_TESTNET_TO = String(ChainId.ArcTestnet)

	// Functions
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { Button, Select, Switch } from 'bits-ui'
	import {
		executeSelectedRoute,
		getRoutesForUsdcBridge,
		getUsdcAddress,
	} from '$/api/lifi'
	import {
		actorCoinsCollection,
		fetchAllBalancesForAddress,
	} from '$/collections/actor-coins'
	import { networksCollection } from '$/collections/networks'
	import {
		extractRouteLimits,
		USDC_MAX_AMOUNT,
		USDC_MIN_AMOUNT,
	} from '$/constants/bridge-limits'
	import { getTxUrl } from '$/constants/explorers'
	import { networksByChainId } from '$/constants/networks'
	import { queryClient } from '$/lib/db/query-client'
	import { debounce } from '$/lib/debounce'
	import { categorizeError, ErrorCode, isBridgeError } from '$/lib/errors'
	import {
		formatTokenAmount,
		parseDecimalToSmallest,
	} from '$/lib/format'
	import { saveTransaction, updateTransactionStatus } from '$/lib/tx-history'
	import { createInitialStatus } from '$/lib/tx-status'

	// State
	import { networkStatus } from '$/lib/network-status.svelte'
	import { toasts } from '$/lib/toast.svelte'
	import { useBridgeAutoRefresh, useBridgeSlippage } from '$/state/bridge'

	let walletState = $state<WalletState | null>(null)
	const networksQuery = useLiveQuery((q) =>
		q
			.from({ network: networksCollection })
			.orderBy(({ network }) => network.id)
			.select(({ network }) => ({ network })),
	)
	const actorCoinsQuery = useLiveQuery((q) =>
		q
			.from({ actorCoin: actorCoinsCollection })
			.orderBy(({ actorCoin }) => actorCoin.chainId)
			.select(({ actorCoin }) => ({ actorCoin })),
	)
	let fromNetwork = $state<Network | null>(null)
	let toNetwork = $state<Network | null>(null)
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
	let quoteRemainingSec = $state<number | null>(null)
	const slippageState = useBridgeSlippage()
	const autoRefreshState = useBridgeAutoRefresh()

	// (Derived)
	const networks = $derived(
		(networksQuery.data ?? []).map((row) => row.network),
	)
	const defaultIsTestnet = $derived(
		(walletState ?? createWalletState()).isTestnet,
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			defaultIsTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const actorCoins = $derived(
		(actorCoinsQuery.data ?? []).map((row) => row.actorCoin),
	)
	const routesExpiresAt = $derived(
		routesFetchedAt !== null ? routesFetchedAt + QUOTE_VALIDITY_MS : null,
	)
	const quoteIsExpired = $derived(
		quoteRemainingSec !== null && quoteRemainingSec <= 0,
	)
	const quoteExpirationWarning = $derived(
		quoteRemainingSec !== null &&
			quoteRemainingSec > 0 &&
			quoteRemainingSec <= 15,
	)
	const fromNetworkId = $derived(fromNetwork?.id ?? 0)
	const toNetworkId = $derived(toNetwork?.id ?? 0)
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
		const preferredFromId = defaultIsTestnet ? DEFAULT_TESTNET_FROM : DEFAULT_MAINNET_FROM
		const preferredToId = defaultIsTestnet ? DEFAULT_TESTNET_TO : DEFAULT_MAINNET_TO
		if (!fromNetwork || !filtered.some((n) => n.id === fromNetwork!.id)) {
			fromNetwork =
				filtered.find((n) => String(n.id) === preferredFromId) ?? filtered[0]
		}
		const fromId = fromNetwork?.id
		if (!toNetwork || !filtered.some((n) => n.id === toNetwork!.id)) {
			toNetwork =
				(filtered.find((n) => String(n.id) === preferredToId && n.id !== fromId) ??
					filtered.find((n) => n.id !== fromId)) ??
				filtered[0]
		}
	})
	$effect(() => {
		if (!walletState?.address) {
			lastFetchedAddress = null
			lastFetchedChainKey = null
			return
		}
	})
	$effect(() => {
		if (
			!autoRefreshState.current ||
			routesExpiresAt === null ||
			!walletState?.address ||
			routesLoading
		)
			return
		const refreshAt = routesExpiresAt - 5_000
		const delay = refreshAt - Date.now()
		if (delay <= 0) return
		const t = setTimeout(() => {
			if (
				autoRefreshState.current &&
				!routesLoading &&
				walletState?.address
			) {
				void getRoutes(walletState)
			}
		}, delay)
		return () => clearTimeout(t)
	})
	$effect(() => {
		if (routesExpiresAt === null) {
			quoteRemainingSec = null
			return
		}
		const update = () => {
			quoteRemainingSec = Math.max(
				0,
				Math.ceil((routesExpiresAt! - Date.now()) / 1000),
			)
		}
		update()
		const id = setInterval(update, 1000)
		return () => clearInterval(id)
	})
	$effect(() => {
		if (walletState?.address) return
		queryClient.removeQueries({ queryKey: ['actorCoins'] })
	})

	// Actions
	const fetchBalances = async (
		wallet: WalletState,
		chainIds: number[],
	) => {
		const chainKey = [...chainIds].sort((a, b) => a - b).join(',')
		if (
			!wallet.address ||
			(lastFetchedAddress === wallet.address &&
				lastFetchedChainKey === chainKey)
		)
			return
		lastFetchedAddress = wallet.address
		lastFetchedChainKey = chainKey
		await fetchAllBalancesForAddress(wallet.address, chainIds)
	}

	$effect(() => {
		if (
			!walletState?.address ||
			!browser ||
			filteredNetworks.length === 0
		)
			return
		void (async () => {
			await tick()
			fetchBalances(walletState!, filteredNetworks.map((n) => n.id))
		})()
	})

	const getRoutes = async (wallet: WalletState) => {
		if (!wallet.address) return
		routesError = null
		routes = []
		selectedRouteId = null
		routesFetchedAt = null
		routesLoading = true
		try {
			const list = await Promise.race([
				getRoutesForUsdcBridge({
					fromChain: fromNetworkId,
					toChain: toNetworkId,
					fromAmount: parseDecimalToSmallest(amount, 6).toString(),
					fromAddress: wallet.address,
					toAddress: recipient,
					slippage: slippageState.current,
				}),
				new Promise<never>((_, reject) => {
					setTimeout(
						() => reject(new Error('Routes request timed out')),
						ROUTES_REQUEST_TIMEOUT_MS,
					)
				}),
			])
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
			!fromNetwork ||
			!toNetwork
		)
			return
		debouncedGetRoutes(walletState)
		return () => debouncedGetRoutes.cancel()
	})

	const sendTransaction = async (wallet: WalletState) => {
		if (!wallet.connectedDetail || !wallet.address || !selectedRoute) return
		const walletAddress = wallet.address
		execError = null
		execTxHashes = []
		execLoading = true
		bridgeStatus = createInitialStatus()
		const loadingId = toasts.loading('Submitting transaction…')
		let savedPendingId: string | null = null
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
							address: walletAddress,
							fromChainId: fromNetworkId,
							toChainId: toNetworkId,
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
				(s) =>
					(s.execution?.process ?? []) as {
						txHash?: string
						chainId?: number
					}[],
			)
			const hashes = processes
				.map((p) => p.txHash)
				.filter((h): h is string => Boolean(h))
			if (hashes.length > 0) execTxHashes = hashes
			toasts.dismiss(loadingId)
			const firstHash = hashes[0]
			const destProcess = processes.find(
				(p) => p.chainId === toNetworkId && p.txHash,
			)
			const destTxHash = destProcess?.txHash
			if (savedPendingId) {
				updateTransactionStatus(
					walletAddress,
					savedPendingId,
					bridgeStatus.overall === 'failed' ? 'failed' : 'completed',
					destTxHash,
				)
			} else if (firstHash) {
				saveTransaction({
					id: firstHash,
					address: walletAddress,
					fromChainId: fromNetworkId,
					toChainId: toNetworkId,
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
											getTxUrl(fromNetworkId, firstHash),
											'_blank',
										),
								},
							}
						: {}),
				})
			} else if (bridgeStatus.overall === 'failed') {
				const failedStep = bridgeStatus.steps.find(
					(s) => s.state === 'failed',
				)
				execError = categorizeError(
					new Error(failedStep?.error ?? 'Transaction failed'),
				)
			}
		} catch (e) {
			toasts.dismiss(loadingId)
			if (savedPendingId && walletAddress) {
				updateTransactionStatus(walletAddress, savedPendingId, 'failed')
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

	// Components
	import Boundary from '$/components/Boundary.svelte'
	import Skeleton from '$/components/Skeleton.svelte'
	import Spinner from '$/components/Spinner.svelte'
	import ApprovalButton from './ApprovalButton.svelte'
	import ChainSwitchPrompt from './ChainSwitchPrompt.svelte'
	import ConfirmationDialog from './ConfirmationDialog.svelte'
	import ErrorDisplay from './ErrorDisplay.svelte'
	import QuoteForm from './QuoteForm.svelte'
	import QuoteOutput from './QuoteOutput.svelte'
	import RecipientInput from './RecipientInput.svelte'
	import RouteList from './RouteList.svelte'
	import SlippageSettings from './SlippageSettings.svelte'
	import TransactionHistory from './TransactionHistory.svelte'
	import TransactionStatus from './TransactionStatus.svelte'
	import WalletProvider from './WalletProvider.svelte'
</script>

<svelte:head>
	<title>USDC Bridge</title>
</svelte:head>

<WalletProvider onStateChange={(s) => (walletState = s)}>
	{#snippet children(wallet)}
		{@const filteredIds = new Set(filteredNetworks.map((n) => n.id))}
		<div data-column="gap-6">
			<h1>USDC Bridge</h1>

			{#if wallet.address}
				<section
					data-card
					data-column="gap-4"
					aria-labelledby="balances-heading"
				>
					<h2 id="balances-heading">Your USDC Balances</h2>
					{#if actorCoins.filter((ac) => ac.address === wallet.address && filteredIds.has(ac.chainId)).length === 0}
						<div data-balances-grid role="list">
							{#each Array(6) as _, i (i)}
								<dl data-balance-item data-card="secondary" data-loading>
									<dt><Skeleton width="60%" height="0.75em" /></dt>
									<dd><Skeleton width="80%" height="1.25em" /></dd>
								</dl>
							{/each}
						</div>
					{:else}
						<div data-balances-grid role="list">
							{#each actorCoins.filter((ac) => ac.address === wallet.address && filteredIds.has(ac.chainId)) as ac (`${ac.chainId}-${ac.address}-${ac.coinAddress}`)}
								{@const network = networks.find((n) => n.id === ac.chainId)}
								<dl
									data-balance-item
									data-card="secondary"
									data-loading={ac.isLoading ? '' : undefined}
								>
									<dt data-muted data-row="gap-2 align-center">
										<img
											src="/networks/{ac.chainId}.svg"
											alt=""
											width="20"
											height="20"
											class="network-icon"
											loading="lazy"
											decoding="async"
											onerror={(e) => ((e.currentTarget as HTMLImageElement).hidden = true)}
										/>
										<span>{network?.name ?? `Network ${ac.chainId}`}</span>
									</dt>
									<dd data-row="gap-1 align-center" data-tabular>
										{#if ac.isLoading && ac.balance === 0n}
											<Skeleton width="80px" height="1em" />
										{:else if ac.error}
											<span data-error title={ac.error}>Error</span>
										{:else}
											<strong>{ac.balanceFormatted} {ac.coinSymbol}</strong>
											{#if ac.isLoading}
												<Spinner size="0.75em" />
											{/if}
										{/if}
									</dd>
								</dl>
							{/each}
						</div>
					{/if}
				</section>
			{/if}

			<section
				data-card
				data-column="gap-4"
				aria-labelledby="bridge-heading"
			>
				<h2 id="bridge-heading">Bridge</h2>
				<Boundary>
					<div data-bridge-layout>
						<section
							data-bridge-form
							data-column="gap-4"
							aria-labelledby="select-route-heading"
						>
							<h3 id="select-route-heading" class="sr-only">Select route</h3>
							{#if !wallet.address}
								<p>Connect a wallet to get routes.</p>
							{:else if networksQuery.isLoading}
								<p>Loading networks…</p>
							{:else if fromNetwork && toNetwork}
								{@const sourceBalance = actorCoins.find(
									(ac) =>
										ac.address === wallet.address &&
										ac.chainId === fromNetworkId &&
										ac.coinSymbol === 'USDC',
								)?.balance ?? null}
								<QuoteForm
									networks={filteredNetworks}
									bind:fromNetwork
									bind:toNetwork
									bind:amount
									fromAddress={wallet.address}
									balance={sourceBalance}
									loading={routesLoading}
									onSubmit={() => getRoutes(wallet)}
								/>
								<RecipientInput
									walletAddress={wallet.address}
									toNetworkId={toNetworkId}
									bind:recipient
								/>
								{@const fromChainStatus = networkStatus.getChainStatus(fromNetworkId)}
								{#if fromChainStatus?.status === 'degraded'}
									<p data-muted role="alert">
										⚠️
								{networksByChainId[fromNetworkId]?.name ?? fromNetwork?.name ?? `Network ${fromNetworkId}`}
									is experiencing delays
									</p>
								{:else if fromChainStatus?.status === 'down'}
									<p data-error role="alert">
										⛔
								{networksByChainId[fromNetworkId]?.name ?? fromNetwork?.name ?? `Network ${fromNetworkId}`}
									is currently unavailable
									</p>
								{/if}
							{#if routesError?.code === ErrorCode.NO_ROUTES}
								<div data-no-routes data-column="gap-2">
									<p>No routes available for this transfer.</p>
									<ul>
										<li
											>Try a different amount (min ~1 USDC, max varies by
											route)</li
										>
										<li>Try a different network pair</li>
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
							{#if wallet.chainId !== null && wallet.chainId !== fromNetworkId && wallet.connectedDetail}
								<ChainSwitchPrompt
									currentChainId={wallet.chainId}
									requiredChainId={fromNetworkId}
									provider={wallet.connectedDetail.provider}
									onSwitched={() => {}}
								/>
							{/if}
							{:else}
								<p>Loading…</p>
							{/if}
						</section>
						<div data-bridge-output data-column="gap-4">
							{#if routes.length > 0 || routesLoading}
								<section
									aria-labelledby="routes-heading"
									data-column="gap-2"
								>
									<h3 id="routes-heading" class="sr-only">Routes</h3>
									{#if routes.length > 0}
									<div data-column="gap-2">
										<label for="sort-routes" class="sr-only"
											>Sort routes</label
										>
										<Select.Root
											type="single"
											bind:value={sortBy}
											items={[
												{ value: 'recommended', label: 'Recommended' },
												{ value: 'output', label: 'Best output' },
												{ value: 'fees', label: 'Lowest fees' },
												{ value: 'speed', label: 'Fastest' },
											]}
										>
											<Select.Trigger
												id="sort-routes"
												aria-label="Sort routes"
											>
												Sort:
												{sortBy === 'recommended'
													? 'Recommended'
													: sortBy === 'output'
														? 'Best output'
														: sortBy === 'fees'
															? 'Lowest fees'
															: 'Fastest'}
											</Select.Trigger>
											<Select.Portal>
												<Select.Content>
													<Select.Viewport>
														<Select.Item
															value="recommended"
															label="Recommended"
															>Recommended</Select.Item
														>
														<Select.Item
															value="output"
															label="Best output"
															>Best output</Select.Item
														>
														<Select.Item
															value="fees"
															label="Lowest fees"
															>Lowest fees</Select.Item
														>
														<Select.Item
															value="speed"
															label="Fastest"
															>Fastest</Select.Item
														>
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
								</section>
							{/if}
							{#if selectedRoute}
								<section
									aria-labelledby="quote-send-heading"
									data-column="gap-4"
								>
									<h3 id="quote-send-heading" class="sr-only">Quote & send</h3>
									{#if selectedRoute}
										{@const limits = extractRouteLimits([selectedRoute])}
										{@const minDisplay = limits.minAmount ?? USDC_MIN_AMOUNT}
										{@const maxDisplay = limits.maxAmount ?? USDC_MAX_AMOUNT}
										<dl data-route-limits>
											<dt>Min</dt>
											<dd>{formatTokenAmount(String(minDisplay), 6)} USDC</dd>
											<dt>Max</dt>
											<dd>{formatTokenAmount(String(maxDisplay), 6)} USDC</dd>
										</dl>
										{#if routesExpiresAt !== null}
											<div data-row="wrap gap-3 align-center">
												<div
													data-row="gap-2 align-center"
													data-error={quoteIsExpired ? '' : undefined}
													data-muted={!quoteIsExpired && !quoteExpirationWarning ? '' : undefined}
												>
													{#if quoteIsExpired}
														<span>Quote expired – refresh to continue</span>
													{:else}
														<span>Quote valid for {quoteRemainingSec}s</span>
													{/if}
													<button
														type="button"
														onclick={() => getRoutes(wallet)}
														disabled={routesLoading}
													>
														{routesLoading ? 'Refreshing…' : 'Refresh'}
													</button>
												</div>
												<label data-row="gap-2 align-center">
													<Switch.Root
														checked={autoRefreshState.current}
														onCheckedChange={(c) =>
															(autoRefreshState.current = c ?? false)}
														aria-label="Auto-refresh quote before expiry"
													>
														<Switch.Thumb />
													</Switch.Root>
													<span>Auto-refresh before expiry</span>
												</label>
											</div>
										{/if}
										<SlippageSettings
											value={slippageState.current}
											onValueChange={(v) => (slippageState.current = v)}
										/>
										<QuoteOutput
											route={selectedRoute}
											slippage={slippageState.current}
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
												fromNetworkId={fromNetworkId}
												toNetworkId={toNetworkId}
												fromAmount={parseDecimalToSmallest(amount, 6).toString()}
												fromAddress={wallet.address}
												toAddress={recipient}
												slippage={slippageState.current}
												onConfirm={() => sendTransaction(wallet)}
												onCancel={() => {}}
											/>
										{/if}
										{#if needsApprovalCheck && !approvalComplete && wallet.connectedDetail && wallet.address}
											<ApprovalButton
												chainId={fromNetworkId}
												tokenAddress={getUsdcAddress(fromNetworkId)}
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
											fromNetworkId={fromNetworkId}
											toNetworkId={toNetworkId}
										/>
									{/if}
								</section>
							{/if}
						</div>
					</div>

					{#snippet Failed(error, retry)}
						<ErrorDisplay
							error={categorizeError(error)}
							attempt={1}
							onRetry={retry}
						/>
					{/snippet}
				</Boundary>
			</section>

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
		grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
	}

	[data-balance-item] {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	[data-balance-item] dt,
	[data-balance-item] dd {
		margin: 0;
	}

	[data-route-limits] {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25em 1em;
	}

	[data-route-limits] dt,
	[data-route-limits] dd {
		margin: 0;
	}

	[data-bridge-layout] {
		display: grid;
		gap: 1.5em;
		grid-template-columns: 1fr;
	}

	@media (min-width: 768px) {
		[data-bridge-layout] {
			grid-template-columns: 1fr 1fr;
			gap: 2em;
		}
	}

	:global([data-loading]) {
		opacity: 0.6;
	}

	:global([data-error]) {
		color: var(--color-error, #ef4444);
		font-size: 0.875em;
	}

	:global([data-muted]) {
		font-size: 0.75em;
		opacity: 0.7;
	}

	:global([data-tabular]) {
		font-variant-numeric: tabular-nums;
	}
</style>
