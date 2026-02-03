<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import type { TokenListCoinRow } from '$/collections/token-list-coins'
	import type { FetchSwapQuoteParams } from '$/data/SwapQuote'
	import type { Coin } from '$/constants/coins'
	import { CoinType } from '$/constants/coins'
	import { DataSource } from '$/constants/data-sources'
	import { MediaType } from '$/constants/media'
	import {
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks'
	import {
		SLIPPAGE_PRESETS,
		calculateMinOutput,
		formatSlippagePercent,
		parseSlippagePercent,
	} from '$/constants/slippage'
	import { UNIVERSAL_ROUTER_ADDRESS } from '$/constants/uniswap'
	import { WalletConnectionTransport } from '$/data/WalletConnection'

	// Context
	import { Button, Popover } from 'bits-ui'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'

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
		selectedWallet &&
		selectedWallet.connection.transport === WalletConnectionTransport.Eip1193 &&
		'provider' in selectedWallet.wallet ?
			selectedWallet.wallet
		:
			null,
	)

	// Functions
	import { debounce } from '$/lib/debounce'
	import {
		formatSmallestToDecimal,
		formatTokenAmount,
	} from '$/lib/format'
	import { getStorkAssetIdForSymbol } from '$/lib/stork'
	import { getSwapQuote, getSwapQuoteId } from '$/api/uniswap'

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
	const updateAmount = (value: bigint) => (
		swapSettingsState.current = { ...settings, amount: value }
	)
	const updateSlippage = (value: number) => (
		swapSettingsState.current = { ...settings, slippage: value }
	)

	// State
	import {
		bridgeSettingsState,
		defaultBridgeSettings,
	} from '$/state/bridge-settings.svelte'
	import {
		defaultSwapSettings,
		swapSettingsState,
	} from '$/state/swap-settings.svelte'
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

	let executing = $state(false)
	let executionRef = $state<{ execute: () => Promise<void> } | null>(null)
	let invalidAmountInput = $state(false)
	let slippageInput = $state('')
	let tokenInSelection = $state<Coin | null>(null)
	let tokenOutSelection = $state<Coin | null>(null)

	// (Derived)
	const bridgeSettings = $derived(
		bridgeSettingsState.current ?? defaultBridgeSettings,
	)
	const settings = $derived(swapSettingsState.current ?? defaultSwapSettings)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			bridgeSettings.isTestnet ?
				n.type === NetworkType.Testnet
			:
				n.type === NetworkType.Mainnet,
		),
	)
	const network = $derived(
		settings.chainId ?
			networksByChainId[settings.chainId]
		:
			null,
	)
	const quoteParams = $derived(
		settings.amount > 0n && !invalidAmountInput ?
			({
				chainId: settings.chainId,
				tokenIn: settings.tokenIn,
				tokenOut: settings.tokenOut,
				amountIn: settings.amount,
				slippage: settings.slippage,
			} satisfies FetchSwapQuoteParams)
		:
			null,
	)

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

	const chainTokens = $derived(
		(tokenListQuery.data ?? [])
			.map((r) => r.row)
			.filter((token) => token.chainId === settings.chainId),
	)
	const chainCoins = $derived(chainTokens.map(toCoin))
	const chainSymbols = $derived(
		new Map(
			chainTokens.map((token) => [
				token.address.toLowerCase(),
				token.symbol,
			]),
		),
	)
	const tokenInAddress = $derived(tokenInSelection?.address ?? null)
	const tokenOutAddress = $derived(tokenOutSelection?.address ?? null)
	const quoteRow = $derived(
		quoteParams ?
			(quotesQuery.data?.find((r) => r.row.id === getSwapQuoteId(quoteParams))
				?.row ?? null)
		:
			null,
	)
	const quote = $derived(quoteRow ?? null)
	const balances = $derived(
		selectedActor && network ?
			(balancesQuery.data ?? [])
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
		:
			[],
	)
	const tokenInBalance = $derived(
		network && selectedActor && tokenInAddress ?
			(balances.find(
				(b) =>
					b.$id.chainId === network.id &&
					b.$id.tokenAddress.toLowerCase() ===
						tokenInAddress.toLowerCase(),
			)?.balance ?? null)
		:
			null,
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
		selectedActor && network && routerAddress && tokenInAddress ?
			(allowancesQuery.data?.find(
				(r) =>
					r.row.$id.chainId === network.id &&
					r.row.$id.address.toLowerCase() === selectedActor.toLowerCase() &&
					r.row.$id.tokenAddress.toLowerCase() ===
						tokenInAddress.toLowerCase() &&
					r.row.$id.spenderAddress.toLowerCase() ===
						routerAddress.toLowerCase(),
			)?.row ?? null)
		:
			null,
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
		quote ?
			calculateMinOutput(quote.amountOut, settings.slippage)
		:
			null,
	)
	const storkPrices = $derived((storkPricesQuery.data ?? []).map((r) => r.row))
	const tokenInAssetId = $derived(
		tokenInSelection ?
			getStorkAssetIdForSymbol(tokenInSelection.symbol)
		:
			null,
	)
	const tokenOutAssetId = $derived(
		tokenOutSelection ?
			getStorkAssetIdForSymbol(tokenOutSelection.symbol)
		:
			null,
	)
	const tokenInPriceRow = $derived(
		tokenInAssetId && network ?
			getBestStorkPrice(storkPrices, tokenInAssetId, network.id)
		:
			null,
	)
	const tokenOutPriceRow = $derived(
		tokenOutAssetId && network ?
			getBestStorkPrice(storkPrices, tokenOutAssetId, network.id)
		:
			null,
	)
	const storkRate = $derived(
		tokenInPriceRow &&
		tokenOutPriceRow &&
		tokenOutPriceRow.price !== 0n ?
			(tokenInPriceRow.price * 10n ** 18n) / tokenOutPriceRow.price
		:
			null,
	)
	const quoteRate = $derived(
		quote && settings.amount > 0n ?
			(quote.amountOut *
				10n ** 18n *
				10n ** BigInt(tokenInSelection?.decimals ?? 18)) /
				(settings.amount *
					10n ** BigInt(tokenOutSelection?.decimals ?? 18))
		:
			null,
	)
	const rateDeltaBps = $derived(
		storkRate &&
		storkRate !== 0n &&
		quoteRate ?
			((quoteRate > storkRate ?
					quoteRate - storkRate
				:
					storkRate - quoteRate) *
				10_000n) /
				storkRate
		:
			null,
	)
	const rateDeltaPercent = $derived(
		rateDeltaBps !== null ?
			Number(rateDeltaBps) / 100
		:
			null,
	)
	const isQuotePending = $derived(Boolean(quoteParams && !quote))

	// Actions
	const fetchQuote = debounce(() => {
		if (quoteParams) fetchSwapQuote(quoteParams, getSwapQuote).catch(() => {})
	}, 500)
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
		if (!tokenOutSelection || tokenOutSelection.address !== tokenOutMatch.address)
			tokenOutSelection = tokenOutMatch
	})

	$effect(() => {
		if (!asNonEmpty(chainCoins)) return
		if (!tokenInAddress || !tokenOutAddress) return
		if (tokenInAddress !== tokenOutAddress) return
		const fallback = chainCoins.find(
			(coin) => coin.address !== tokenInAddress,
		)
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
		swapSettingsState.current = {
			...settings,
			tokenIn: tokenInAddress,
			tokenOut: tokenOutAddress,
		}
	})

	$effect(() => {
		const nextChainId = filteredNetworks[0]?.id
		if (!nextChainId) return
		if (filteredNetworks.some((n) => n.id === settings.chainId)) return
		swapSettingsState.current = { ...settings, chainId: nextChainId }
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
		if (!tokenOutSelection || tokenOutSelection.address === tokenInSelection.address)
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

	// Components
	import CoinAmount from '$/views/CoinAmount.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import CoinInput from '$/views/CoinInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import TransactionFlow from '$/views/TransactionFlow.svelte'
	import TokenApproval from '$/routes/bridge/lifi/TokenApproval.svelte'
	import SwapExecution from './SwapExecution.svelte'
</script>


<section data-card data-column="gap-4">
	{#snippet swapSummary()}
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
	{/snippet}

	{#snippet swapDetails(_tx: unknown, _state: unknown)}
		{#if needsApproval && selectedActor && selectedEip1193Wallet && routerAddress}
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
				bind:this={executionRef}
			/>
		{/if}
	{/snippet}

	<div data-row="gap-2 align-center justify-between">
		<h2>Swap</h2>
		<NetworkInput
			networks={filteredNetworks}
			value={settings.chainId}
			onValueChange={(value) => {
				const nextChainId = Array.isArray(value) ? value[0] ?? null : value
				if (nextChainId === null || nextChainId === settings.chainId) return
				swapSettingsState.current = { ...settings, chainId: nextChainId }
			}}
		/>
	</div>

	{#if asNonEmpty(chainCoins) && tokenInSelection && tokenOutSelection}
		<section data-column="gap-2">
			<div data-card="secondary" data-column="gap-2">
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
					value={settings.amount}
					invalid={invalidAmountInput}
					onValueChange={updateAmount}
					onInvalidChange={(invalid) => {
						invalidAmountInput = invalid
					}}
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
						swapSettingsState.current = {
							...settings,
							tokenIn: tokenOutSelection.address,
							tokenOut: tokenInSelection.address,
							amount: 0n,
						}
					}}
					aria-label="Swap direction"
				>
					↕
				</Button.Root>
			</div>

			<div data-card="secondary" data-column="gap-2">
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
		</section>

		<section data-card data-column="gap-3">
			<div data-row="gap-2 align-center justify-between">
				<h3>Quote details</h3>
				{#if isQuotePending}
					<span data-muted>Refreshing…</span>
				{/if}
			</div>

			<Popover.Root>
				<Popover.Trigger data-row="gap-1"
					>Slippage: <strong
						>{formatSlippagePercent(settings.slippage)}</strong
					></Popover.Trigger
				>
				<Popover.Content data-column="gap-2">
					<div data-row="gap-1">
						{#each SLIPPAGE_PRESETS as preset (preset)}
							<Button.Root
								onclick={() => updateSlippage(preset)}
								data-selected={settings.slippage === preset ? '' : undefined}
							>
								{formatSlippagePercent(preset)}
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

			{#if quote}
				<dl class="summary">
					<dt>Price impact</dt>
					<dd>
						{quote.priceImpact.toFixed(2)}%
						{#if priceImpactWarning}
							<span data-error>High impact</span>
						{/if}
					</dd>
					{#if minOutput !== null}
						<dt>Min received</dt>
						<dd>
							{formatTokenAmount(minOutput, tokenOutSelection.decimals)}
							{tokenOutSelection.symbol}
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
				</dl>
			{/if}
		</section>

		<TransactionFlow
			walletConnection={selectedWallet}
			Summary={swapSummary}
			transactions={quote
				? [
						{
							id: 'swap',
							chainId: settings.chainId,
							title: 'Swap',
							actionLabel: executing ? 'Swapping…' : 'Swap',
							canExecute:
								Boolean(canSwap && selectedActor && selectedEip1193Wallet) &&
								!executing,
							execute: (_args) =>
								executionRef ? executionRef.execute() : Promise.resolve(),
							Details: swapDetails,
							requiresConfirmation: priceImpactWarning,
							confirmationLabel: priceImpactWarning
								? 'I understand this trade has high price impact'
								: undefined,
						},
					]
				: []}
		/>
	{:else}
		<p data-muted>No tokens available for this network.</p>
	{/if}
</section>
