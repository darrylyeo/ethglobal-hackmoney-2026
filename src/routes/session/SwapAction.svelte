<script lang="ts">


	// Types/constants
	import type { TokenListCoinRow } from '$/collections/token-list-coins'
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import type { Coin } from '$/constants/coins'
	import type { FetchSwapQuoteParams } from '$/data/SwapQuote'
	import type { SwapSessionParams } from '$/lib/transaction-session-params'
	import { CoinType } from '$/constants/coins'
	import { DataSource } from '$/constants/data-sources'
	import { MediaType } from '$/constants/media'
	import {
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks'
	import {
		calculateMinOutput,
		formatSlippagePercent,
		parseSlippagePercent,
		slippagePresets,
	} from '$/constants/slippage'
	import { UNIVERSAL_ROUTER_ADDRESS } from '$/constants/uniswap'
	import { WalletConnectionTransport } from '$/data/WalletConnection'


	// Context
	import { getContext, untrack } from 'svelte'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { Button, Popover } from 'bits-ui'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'
	import {
		getEffectiveHash,
		setEffectiveHash,
		SESSION_HASH_SOURCE_KEY,
	} from '$/lib/dashboard-panel-hash'


	// Functions
	import { getSwapQuote, getSwapQuoteId } from '$/api/uniswap'
	import { rpcUrls } from '$/constants/rpc-endpoints'
	import { debounce } from '$/lib/debounce'
	import {
		extractSimulationSummary,
		runTevmSimulationFromClient,
	} from '$/lib/tevm-simulation'
	import { formatSmallestToDecimal, formatTokenAmount } from '$/lib/format'
	import { getStorkAssetIdForSymbol } from '$/lib/stork'
	import { stringify } from '$/lib/stringify'
	import { normalizeSwapSessionParams } from '$/lib/transaction-session-params'
	import {
		buildSessionHash,
		createSessionId,
		createTransactionSessionSimulation,
		createTransactionSessionWithId,
		parseSessionHash,
		updateTransactionSession,
	} from '$/lib/transaction-sessions'


	// State
	import { actorAllowancesCollection } from '$/collections/actor-allowances'
	import {
		actorCoinsCollection,
		fetchActorCoinBalance,
	} from '$/collections/actor-coins'
	import {
		getBestStorkPrice,
		storkPricesCollection,
		subscribeStorkPrices,
	} from '$/collections/stork-prices'
	import {
		fetchSwapQuote,
		swapQuotesCollection,
	} from '$/collections/swap-quotes'
	import { tokenListCoinsCollection } from '$/collections/token-list-coins'
	import { transactionSessionSimulationsCollection } from '$/collections/transaction-session-simulations'
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'


	// Components
	import TokenApproval from '$/routes/bridge/lifi/TokenApproval.svelte'
	import CoinAmount from '$/views/CoinAmount.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import CoinInput from '$/views/CoinInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import SessionAction from '$/views/SessionAction.svelte'
	import SimulationEventPanel from '$/views/SimulationEventPanel.svelte'
	import SimulationTracePanel from '$/views/SimulationTracePanel.svelte'
	import SwapExecution from './SwapExecution.svelte'


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

	const asNonEmpty = (coins: Coin[]): coins is [Coin, ...Coin[]] =>
		coins.length > 0
	const toCoin = (token: TokenListCoinRow): Coin => ({
		type: CoinType.Erc20,
		chainId: token.chainId,
		address: token.address,
		symbol: token.symbol,
		name: token.name,
		decimals: token.decimals,
		icon: token.logoURI
			? {
					type: MediaType.Image,
					original: {
						url: token.logoURI,
					},
				}
			: undefined,
	})
	const resolveNetwork = (chainId: number | null) =>
		chainId !== null
			? (Object.values(networksByChainId).find(
					(entry) => entry?.id === chainId,
				) ?? null)
			: null
	const normalizeSwapParams = (
		params: Record<string, unknown> | null,
	): SwapSessionParams => normalizeSwapSessionParams(params)


	// State
	let activeSessionId = $state<string | null>(null)
	let pendingSessionId = $state<string | null>(null)
	let lookupSessionId = $state<string | null>(null)
	let invalidAmountInput = $state(false)
	let slippageInput = $state('')
	let tokenInSelection = $state<Coin | null>(null)
	let tokenOutSelection = $state<Coin | null>(null)
	let localParams = $state<SwapSessionParams>(normalizeSwapParams(null))
	let executing = $state(false)
	let executeFunction = $state<(() => Promise<{ txHash?: `0x${string}` } | void>) | null>(null)

	const setLocalParamsIfChanged = (next: SwapSessionParams) => {
		if (untrack(() => stringify(localParams)) === stringify(next)) return
		localParams = next
	}
	const setActiveSessionId = (next: string | null) => {
		if (activeSessionId === next) return
		activeSessionId = next
	}
	const setPendingSessionId = (next: string | null) => {
		if (pendingSessionId === next) return
		pendingSessionId = next
	}


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
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const sessionLocked = $derived(Boolean(session?.lockedAt))
	const settings = $derived(localParams)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			settings.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const network = $derived(resolveNetwork(settings.chainId))
	const quoteParams = $derived(
		settings.amount > 0n && !invalidAmountInput
			? ({
					chainId: settings.chainId,
					tokenIn: settings.tokenIn,
					tokenOut: settings.tokenOut,
					amountIn: settings.amount,
					slippage: settings.slippage,
				} satisfies FetchSwapQuoteParams)
			: null,
	)
	const selectedWallet = $derived(
		selectedWallets.find((w) => w.connection.selected) ?? null,
	)
	const selectedEip1193Wallet = $derived(
		selectedWallet &&
			selectedWallet.connection.transport ===
				WalletConnectionTransport.Eip1193 &&
			'provider' in selectedWallet.wallet
			? selectedWallet.wallet
			: null,
	)
	const hashSource = getContext<
		import('$/lib/dashboard-panel-hash').SessionHashSource
	>(SESSION_HASH_SOURCE_KEY)
	const effectiveHash = $derived(getEffectiveHash(hashSource))

	const quotesQuery = useLiveQuery((q) =>
		q
			.from({ row: swapQuotesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Uniswap))
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
	const tokenListQuery = useLiveQuery((q) =>
		q
			.from({ row: tokenListCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.TokenLists))
			.select(({ row }) => ({ row })),
	)
	const storkPricesQuery = useLiveQuery((q) =>
		q
			.from({ row: storkPricesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Stork))
			.select(({ row }) => ({ row })),
	)
	const latestSimulationId = $derived(session?.latestSimulationId ?? '')
	const simulationQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionSimulationsCollection })
				.where(({ row }) => eq(row.id, latestSimulationId))
				.select(({ row }) => ({ row })),
		[() => latestSimulationId],
	)
	const latestSimulation = $derived(simulationQuery.data?.[0]?.row ?? null)
	const simulationResult = $derived(
		latestSimulation?.result as {
			trace?: unknown[]
			events?: unknown[]
			rawLogs?: unknown[]
		} | null,
	)
	const liveQueryEntries = [
		{
			id: 'swap-action-session',
			label: 'Session',
			query: sessionQuery,
		},
		{
			id: 'swap-action-quotes',
			label: 'Swap Quotes',
			query: quotesQuery,
		},
		{
			id: 'swap-action-balances',
			label: 'Balances',
			query: balancesQuery,
		},
		{
			id: 'swap-action-allowances',
			label: 'Allowances',
			query: allowancesQuery,
		},
		{
			id: 'swap-action-token-list',
			label: 'Token List',
			query: tokenListQuery,
		},
		{
			id: 'swap-action-stork-prices',
			label: 'Stork Prices',
			query: storkPricesQuery,
		},
		{
			id: 'swap-action-simulation',
			label: 'Simulation',
			query: simulationQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const chainTokens = $derived(
		(tokenListQuery.data ?? [])
			.map((r) => r.row)
			.filter((token) => token.chainId === settings.chainId),
	)
	const chainCoins = $derived(chainTokens.map(toCoin))
	const chainSymbols = $derived(
		new Map(
			chainTokens.map((token) => [token.address.toLowerCase(), token.symbol]),
		),
	)
	const tokenInAddress = $derived(tokenInSelection?.address ?? null)
	const tokenOutAddress = $derived(tokenOutSelection?.address ?? null)
	const quoteRow = $derived(
		quoteParams
			? (quotesQuery.data?.find((r) => r.row.id === getSwapQuoteId(quoteParams))
					?.row ?? null)
			: null,
	)
	const quote = $derived(quoteRow ?? null)
	const balances = $derived(
		selectedActor && network
			? (balancesQuery.data ?? [])
					.map((r) => r.row)
					.filter(
						(b) =>
							b.$id.address.toLowerCase() === selectedActor.toLowerCase() &&
							b.$id.chainId === network.id &&
							chainTokens.some(
								(token) =>
									token.address.toLowerCase() ===
									b.$id.tokenAddress.toLowerCase(),
							),
					)
			: [],
	)
	const tokenInBalance = $derived(
		network && selectedActor && tokenInAddress
			? (balances.find(
					(b) =>
						b.$id.chainId === network.id &&
						b.$id.tokenAddress.toLowerCase() === tokenInAddress.toLowerCase(),
				)?.balance ?? null)
			: null,
	)
	const routerAddress = $derived(
		UNIVERSAL_ROUTER_ADDRESS[settings.chainId] ?? null,
	)
	const needsApproval = $derived(
		Boolean(
			routerAddress &&
			settings.amount > 0n &&
			tokenInSelection?.type !== CoinType.Native,
		),
	)
	const allowanceRow = $derived(
		selectedActor && network && routerAddress && tokenInAddress
			? (allowancesQuery.data?.find(
					(r) =>
						r.row.$id.chainId === network.id &&
						r.row.$id.address.toLowerCase() === selectedActor.toLowerCase() &&
						r.row.$id.tokenAddress.toLowerCase() ===
							tokenInAddress.toLowerCase() &&
						r.row.$id.spenderAddress.toLowerCase() ===
							routerAddress.toLowerCase(),
				)?.row ?? null)
			: null,
	)
	const hasSufficientAllowance = $derived(
		allowanceRow ? allowanceRow.allowance >= settings.amount : !needsApproval,
	)
	const canSwap = $derived(
		settings.amount > 0n &&
			!invalidAmountInput &&
			(hasSufficientAllowance || !needsApproval) &&
			quote &&
			selectedEip1193Wallet,
	)
	const priceImpactWarning = $derived(quote ? quote.priceImpact > 1 : false)
	const minOutput = $derived(
		quote ? calculateMinOutput(quote.amountOut, settings.slippage) : null,
	)
	const storkPrices = $derived((storkPricesQuery.data ?? []).map((r) => r.row))
	const tokenInAssetId = $derived(
		tokenInSelection ? getStorkAssetIdForSymbol(tokenInSelection.symbol) : null,
	)
	const tokenOutAssetId = $derived(
		tokenOutSelection
			? getStorkAssetIdForSymbol(tokenOutSelection.symbol)
			: null,
	)
	const tokenInPriceRow = $derived(
		tokenInAssetId && network
			? getBestStorkPrice(storkPrices, tokenInAssetId, network.id)
			: null,
	)
	const tokenOutPriceRow = $derived(
		tokenOutAssetId && network
			? getBestStorkPrice(storkPrices, tokenOutAssetId, network.id)
			: null,
	)
	const storkRate = $derived(
		tokenInPriceRow && tokenOutPriceRow && tokenOutPriceRow.price !== 0n
			? (tokenInPriceRow.price * 10n ** 18n) / tokenOutPriceRow.price
			: null,
	)
	const quoteRate = $derived(
		quote && settings.amount > 0n
			? (quote.amountOut *
					10n ** 18n *
					10n ** BigInt(tokenInSelection?.decimals ?? 18)) /
					(settings.amount * 10n ** BigInt(tokenOutSelection?.decimals ?? 18))
			: null,
	)
	const rateDeltaBps = $derived(
		storkRate && storkRate !== 0n && quoteRate
			? ((quoteRate > storkRate
					? quoteRate - storkRate
					: storkRate - quoteRate) *
					10_000n) /
					storkRate
			: null,
	)
	const rateDeltaPercent = $derived(
		rateDeltaBps !== null ? Number(rateDeltaBps) / 100 : null,
	)
	const isQuotePending = $derived(Boolean(quoteParams && !quote))

	const updateParams = (nextParams: SwapSessionParams) => {
		setLocalParamsIfChanged(nextParams)
	}
	const updateAmount = (value: bigint) =>
		updateParams({ ...settings, amount: value })
	const updateSlippage = (value: number) =>
		updateParams({ ...settings, slippage: value })
	const setSessionHash = (sessionId: string) => {
		setActiveSessionId(sessionId)
		setPendingSessionId(null)
		setEffectiveHash(hashSource, buildSessionHash(sessionId))
	}
	const persistDraft = () => {
		const nextParams = normalizeSwapParams(settings)
		const current = session
		const shouldCreate = !current || current.lockedAt
		const sessionId = shouldCreate
			? (pendingSessionId ?? createSessionId())
			: current.id
		if (shouldCreate) {
			createTransactionSessionWithId(sessionId, {
				actions: ['swap'],
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
		const nextParams = normalizeSwapParams(settings)
		const current = session
		const shouldCreate = !current || current.lockedAt
		const sessionId = shouldCreate
			? (pendingSessionId ?? createSessionId())
			: current.id
		if (shouldCreate) {
			createTransactionSessionWithId(sessionId, {
				actions: ['swap'],
				params: nextParams,
			})
		}
		updateTransactionSession(sessionId, (session) => ({
			...session,
			params: nextParams,
			lockedAt: session.lockedAt ?? Date.now(),
			updatedAt: Date.now(),
		}))
		const tevmResult = result as {
			summaryStatus?: string
			revertReason?: string
		}
		const simStatus =
			tevmResult.summaryStatus === 'success' ? 'success' : 'failed'
		const simulationId = createTransactionSessionSimulation({
			sessionId,
			params: nextParams,
			status: tevmResult.summaryStatus != null ? simStatus : 'success',
			result,
			...(tevmResult.revertReason ? { error: tevmResult.revertReason } : {}),
		})
		const summary = extractSimulationSummary(result)
		updateTransactionSession(sessionId, (session) => ({
			...session,
			latestSimulationId: simulationId,
			simulationCount: (session.simulationCount ?? 0) + 1,
			...(summary ? { simulation: summary } : {}),
			updatedAt: Date.now(),
		}))
		setSessionHash(sessionId)
	}
	const persistExecution = (txHash?: `0x${string}`) => {
		const nextParams = normalizeSwapParams(settings)
		const current = session
		const shouldCreate = !current || current.lockedAt
		const sessionId = shouldCreate
			? (pendingSessionId ?? createSessionId())
			: current.id
		if (shouldCreate) {
			createTransactionSessionWithId(sessionId, {
				actions: ['swap'],
				params: nextParams,
			})
		}
		updateTransactionSession(sessionId, (session) => ({
			...session,
			params: nextParams,
			status: 'Finalized',
			lockedAt: session.lockedAt ?? Date.now(),
			execution: {
				submittedAt: session.execution?.submittedAt ?? Date.now(),
				chainId: settings.chainId,
				txHash: txHash ?? session.execution?.txHash,
			},
			finalization: {
				at: Date.now(),
			},
			updatedAt: Date.now(),
		}))
		setSessionHash(sessionId)
	}

	const fetchQuote = debounce(() => {
		if (quoteParams) fetchSwapQuote(quoteParams, getSwapQuote).catch(() => {})
	}, 500)

	$effect(() => {
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
		setActiveSessionId(null)
		setPendingSessionId(null)
		setLocalParamsIfChanged(
			normalizeSwapParams(
				parsed.kind === 'actions' ? (parsed.actions[0]?.params ?? null) : null,
			),
		)
	})
	$effect(() => {
		if (!lookupSessionId || !lookupSessionQuery.isReady) return
		const existing = lookupSession
		if (existing) {
			setActiveSessionId(lookupSessionId)
			setPendingSessionId(null)
			setLocalParamsIfChanged(normalizeSwapParams(existing.params ?? null))
		} else {
			setActiveSessionId(null)
			setPendingSessionId(lookupSessionId)
			setLocalParamsIfChanged(normalizeSwapParams(null))
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
			setActiveSessionId(null)
			setPendingSessionId(null)
			setLocalParamsIfChanged(
				normalizeSwapParams(
					parsed.kind === 'actions'
						? (parsed.actions[0]?.params ?? null)
						: null,
				),
			)
		}
		handleHash()
		window.addEventListener('hashchange', handleHash)
		return () => window.removeEventListener('hashchange', handleHash)
	})

	$effect(() => {
		if (quoteParams) {
			fetchQuote()
			return () => fetchQuote.cancel()
		}
	})

	$effect(() => {
		if (!asNonEmpty(chainCoins)) return
		const tokenInMatch =
			chainCoins.find(
				(coin) => coin.address.toLowerCase() === settings.tokenIn.toLowerCase(),
			) ?? chainCoins[0]
		const tokenOutMatch =
			chainCoins.find(
				(coin) =>
					coin.address.toLowerCase() === settings.tokenOut.toLowerCase(),
			) ??
			chainCoins.find((coin) => coin.address !== tokenInMatch.address) ??
			tokenInMatch
		if (!tokenInSelection || tokenInSelection.address !== tokenInMatch.address)
			tokenInSelection = tokenInMatch
		if (
			!tokenOutSelection ||
			tokenOutSelection.address !== tokenOutMatch.address
		)
			tokenOutSelection = tokenOutMatch
	})

	$effect(() => {
		if (!asNonEmpty(chainCoins)) return
		if (!tokenInAddress || !tokenOutAddress) return
		if (tokenInAddress !== tokenOutAddress) return
		const fallback = chainCoins.find((coin) => coin.address !== tokenInAddress)
		if (fallback) tokenOutSelection = fallback
	})

	$effect(() => {
		if (!tokenInAddress || !tokenOutAddress) return
		if (tokenInAddress === tokenOutAddress) return
		if (
			tokenInAddress === settings.tokenIn &&
			tokenOutAddress === settings.tokenOut
		)
			return
		updateParams({
			...settings,
			tokenIn: tokenInAddress,
			tokenOut: tokenOutAddress,
		})
	})

	$effect(() => {
		const nextChainId = filteredNetworks[0]?.id
		if (!nextChainId) return
		if (filteredNetworks.some((n) => n.id === settings.chainId)) return
		updateParams({ ...settings, chainId: nextChainId })
	})

	$effect(() => {
		const assetIds = [tokenInAssetId, tokenOutAssetId].flatMap((assetId) =>
			assetId ? [assetId] : [],
		)
		if (assetIds.length === 0) return
		const unsubscribers = [
			subscribeStorkPrices({ assetIds, transports: ['rest', 'websocket'] }),
			...(network
				? [
						subscribeStorkPrices({
							assetIds,
							chainId: network.id,
							transports: ['rpc'],
						}),
					]
				: []),
		]
		return () => {
			for (const unsubscribe of unsubscribers) unsubscribe()
		}
	})

	$effect(() => {
		if (!selectedActor || !network || !tokenInSelection) return
		void fetchActorCoinBalance(
			{
				chainId: network.id,
				address: selectedActor,
				tokenAddress: tokenInSelection.address,
			},
			tokenInSelection.symbol,
			tokenInSelection.decimals,
		)
		if (
			!tokenOutSelection ||
			tokenOutSelection.address === tokenInSelection.address
		)
			return
		void fetchActorCoinBalance(
			{
				chainId: network.id,
				address: selectedActor,
				tokenAddress: tokenOutSelection.address,
			},
			tokenOutSelection.symbol,
			tokenOutSelection.decimals,
		)
	})

	$effect(() => {
		balanceTokens =
			network && tokenInSelection && tokenOutSelection
				? [
						{ chainId: network.id, tokenAddress: tokenInSelection.address },
						{ chainId: network.id, tokenAddress: tokenOutSelection.address },
					]
				: []
	})

	const onSubmit = async (event: SubmitEvent) => {
		event.preventDefault()
		const form = event.currentTarget
		if (!(form instanceof HTMLFormElement)) return
		const intent = new FormData(form).get('intent')
		if (intent === 'save') {
			persistDraft()
			return
		}
		if (intent === 'simulate') {
			if (!quote) return
			const rpcUrl = rpcUrls[settings.chainId]
			const from = selectedActor
			const router = UNIVERSAL_ROUTER_ADDRESS[settings.chainId]
			const to =
				router && router !== '0x0000000000000000000000000000000000000000'
					? router
					: quote.tokenIn
			if (rpcUrl && from) {
				void runTevmSimulationFromClient({
					rpcUrl,
					chainId: settings.chainId,
					from,
					to,
					data: '0x',
					value: '0',
					gasLimit: quote.gasEstimate.toString(),
				})
					.then(({ result: tevmResult }) => persistSimulation(tevmResult))
					.catch(() => persistSimulation(quote))
			} else {
				persistSimulation(quote)
			}
			return
		}
		if (intent === 'submit') {
			if (!executionRef) return
			try {
				const result = await executeFunction!()
				persistExecution(
					typeof result === 'object' && result ? result.txHash : undefined,
				)
			} catch {
				return
			}
		}
	}
</script>


<SessionAction
	title="Swap"
	description={sessionLocked ? 'Last saved session is locked.' : undefined}
	onsubmit={onSubmit}
>
	{#snippet Params()}
		<div data-row="gap-2 align-center justify-between">
			<NetworkInput
				networks={filteredNetworks}
				bind:value={
					() => settings.chainId,
					(value) => {
						const nextChainId = Array.isArray(value)
							? (value[0] ?? null)
							: value
						if (nextChainId === null || nextChainId === settings.chainId)
							return
						updateParams({ ...settings, chainId: nextChainId })
					}
				}
			/>
		</div>

		{#if asNonEmpty(chainCoins) && tokenInSelection && tokenOutSelection}
			<div data-column="gap-2">
				<div data-card data-column="gap-2">
					<div data-row="gap-2 align-center justify-between">
						<label for="swap-amount-in">From</label>
						{#if tokenInBalance !== null}
							<Button.Root
								type="button"
								onclick={() => updateAmount(tokenInBalance)}
								disabled={tokenInBalance === 0n}
							>
								Max
							</Button.Root>
						{/if}
					</div>
					<CoinAmountInput
						id="swap-amount-in"
						coins={chainCoins}
						bind:coin={tokenInSelection}
						min={0n}
						max={tokenInBalance ?? 0n}
						bind:value={() => settings.amount, updateAmount}
						bind:invalid={
							() => invalidAmountInput,
							(invalid) => (invalidAmountInput = invalid)
						}
						ariaLabel="Token in"
					/>
					{#if tokenInBalance !== null}
						<small data-muted>
							Balance: {formatSmallestToDecimal(
								tokenInBalance,
								tokenInSelection.decimals,
								4,
							)}
							{tokenInSelection.symbol}
						</small>
					{/if}
				</div>

				<div data-row="center">
					<Button.Root
						type="button"
						onclick={() => {
							if (!tokenInSelection || !tokenOutSelection) return
							updateParams({
								...settings,
								tokenIn: tokenOutSelection.address,
								tokenOut: tokenInSelection.address,
								amount: 0n,
							})
						}}
						aria-label="Swap direction"
					>
						↕
					</Button.Root>
				</div>

				<div data-card data-column="gap-2">
					<label for="swap-token-out">To</label>
					<div data-row="gap-2 align-center wrap">
						<div data-row-item="flexible">
							{#if quote}
								<CoinAmount
									coin={tokenOutSelection}
									amount={quote.amountOut}
									draggable={false}
								/>
							{:else if isQuotePending}
								<span data-muted>Fetching quote…</span>
							{:else}
								<span data-muted>0</span>
							{/if}
						</div>
						<div data-row-item="basis-3">
							<CoinInput
								coins={chainCoins}
								bind:value={tokenOutSelection}
								id="swap-token-out"
								ariaLabel="Token out"
							/>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<p data-muted>No tokens available for this network.</p>
		{/if}
	{/snippet}

	{#snippet Protocol()}
		<div data-card data-column="gap-2">
			<div data-row="gap-2 align-center justify-between">
				<h3>Protocol</h3>
				<span data-muted>Uniswap</span>
			</div>
			<Popover.Root>
				<Popover.Trigger data-row="gap-1">
					Slippage: <strong>{formatSlippagePercent(settings.slippage)}</strong
					>
				</Popover.Trigger>
				<Popover.Content data-column="gap-2">
					<div data-row="gap-1">
						{#each slippagePresets as preset (preset.id)}
							<Button.Root
								onclick={() => updateSlippage(preset.value)}
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
							if (nextSlippage !== null) updateSlippage(nextSlippage)
						}}
					/>
				</Popover.Content>
			</Popover.Root>
		</div>
	{/snippet}

	{#snippet Preview()}
		{#if quote && tokenInSelection && tokenOutSelection}
			<dl class="summary">
				<dt>You send</dt>
				<dd>
					{formatTokenAmount(settings.amount, tokenInSelection.decimals)}
					{tokenInSelection.symbol}
				</dd>
				<dt>You receive</dt>
				<dd>
					~{formatTokenAmount(quote.amountOut, tokenOutSelection.decimals)}
					{tokenOutSelection.symbol}
				</dd>
				{#if minOutput !== null}
					<dt>Min received</dt>
					<dd>
						{formatTokenAmount(minOutput, tokenOutSelection.decimals)}
						{tokenOutSelection.symbol}
					</dd>
				{/if}
				<dt>Price impact</dt>
				<dd>{quote.priceImpact.toFixed(2)}%</dd>
				<dt>Slippage</dt>
				<dd>{formatSlippagePercent(settings.slippage)}</dd>
			</dl>
		{/if}

		{#if quote && selectedActor && selectedEip1193Wallet && routerAddress}
			<TokenApproval
				chainId={settings.chainId}
				tokenAddress={settings.tokenIn}
				spenderAddress={routerAddress}
				amount={settings.amount}
				provider={selectedEip1193Wallet.provider}
				ownerAddress={selectedActor}
			/>
		{/if}

		{#if quote && selectedActor && selectedEip1193Wallet}
			<SwapExecution
				{quote}
				walletProvider={selectedEip1193Wallet.provider}
				walletAddress={selectedActor}
				amount={settings.amount}
				bind:executing
				onExecute={(executeFn) => {
					executeFunction = executeFn
				}}
			/>
		{/if}

		{#if quote && tokenInSelection && tokenOutSelection}
			<div data-card data-column="gap-2">
				<dl class="summary">
					{#if tokenInPriceRow && tokenOutPriceRow}
						<dt>Market vs quote</dt>
						<dd>
							<span data-row="gap-1 align-center wrap">
								<span>
									Stork: 1 {tokenInSelection.symbol} ≈ {formatSmallestToDecimal(
										storkRate ?? 0n,
										18,
										6,
									)}
									{tokenOutSelection.symbol}
								</span>
								{#if quoteRate !== null}
									<span>
										Quote: 1 {tokenInSelection.symbol} ≈ {formatSmallestToDecimal(
											quoteRate,
											18,
											6,
										)}
										{tokenOutSelection.symbol}
									</span>
									{#if rateDeltaPercent !== null}
										<span>Δ {rateDeltaPercent.toFixed(2)}%</span>
									{/if}
								{/if}
							</span>
						</dd>
					{/if}
					{#if quote.route.length > 0}
						<dt>Route</dt>
						<dd>
							{#each quote.route as step, index (step.poolId)}
								{@const tokenInSymbol =
									chainSymbols.get(step.tokenIn.toLowerCase()) ??
									step.tokenIn.slice(0, 6)}
								{@const tokenOutSymbol =
									chainSymbols.get(step.tokenOut.toLowerCase()) ??
									step.tokenOut.slice(0, 6)}
								<span>
									{tokenInSymbol} → {tokenOutSymbol} ({step.fee / 100}%)
									{index < quote.route.length - 1 ? ' · ' : ''}
								</span>
							{/each}
						</dd>
					{/if}
				</dl>
			</div>
		{/if}

		<div data-row="gap-2 align-center wrap">
			<Button.Root type="submit" name="intent" value="save">
				Save Draft
			</Button.Root>
			<Button.Root
				type="submit"
				name="intent"
				value="simulate"
				disabled={!quote}
			>
				Simulate
			</Button.Root>
			<Button.Root
				type="submit"
				name="intent"
				value="submit"
				disabled={!canSwap || executing}
			>
				{executing ? 'Swapping…' : 'Sign and Submit'}
			</Button.Root>
		</div>
	{/snippet}
</SessionAction>

{#if simulationResult?.trace?.length || simulationResult?.events?.length}
	<section data-column="gap-3" data-simulation-panels>
		{#if simulationResult.trace?.length}
			<SimulationTracePanel trace={simulationResult.trace} />
		{/if}
		{#if simulationResult.events?.length || simulationResult.rawLogs?.length}
			<SimulationEventPanel
				events={simulationResult.events ?? []}
				rawLogs={(simulationResult.rawLogs ?? []) as {
					address: string
					topics: string[]
					data: string
				}[]}
			/>
		{/if}
	</section>
{/if}
