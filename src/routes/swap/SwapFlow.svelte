<script lang="ts">
import type { ConnectedWallet } from '$/collections/wallet-connections'
import { WalletConnectionTransport } from '$/data/WalletConnection'
	import { Button, Popover } from 'bits-ui'
import { useLiveQuery, eq } from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
	import {
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks'
	import { UNIVERSAL_ROUTER_ADDRESS } from '$/constants/uniswap'
	import {
		bridgeSettingsState,
		defaultBridgeSettings,
	} from '$/state/bridge-settings.svelte'
	import {
		swapSettingsState,
		defaultSwapSettings,
	} from '$/state/swap-settings.svelte'
	import type { TokenListCoinRow } from '$/collections/token-list-coins'
	import { tokenListCoinsCollection } from '$/collections/token-list-coins'
	import {
		swapQuotesCollection,
		fetchSwapQuote,
	} from '$/collections/swap-quotes'
	import type { FetchSwapQuoteParams } from '$/data/SwapQuote'
	import {
		actorCoinsCollection,
		fetchActorCoinBalance,
	} from '$/collections/actor-coins'
	import { actorAllowancesCollection } from '$/collections/actor-allowances'
	import {
		storkPricesCollection,
		subscribeStorkPrices,
		getBestStorkPrice,
	} from '$/collections/stork-prices'
	import { getSwapQuote, getSwapQuoteId } from '$/api/uniswap'
	import {
		formatSmallestToDecimal,
		parseDecimalToSmallest,
		isValidDecimalInput,
	} from '$/lib/format'
	import { debounce } from '$/lib/debounce'
	import { getStorkAssetIdForSymbol } from '$/lib/stork'
	import Select from '$/components/Select.svelte'
	import TransactionFlow from '$/components/TransactionFlow.svelte'
	import TokenApproval from '$/routes/bridge/lifi/TokenApproval.svelte'
	import SwapExecution from './SwapExecution.svelte'

	let {
		selectedWallets,
		selectedActor,
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
	} = $props()

	const selectedWallet = $derived(
		selectedWallets.find((w) => w.connection.selected) ?? null,
	)
	const selectedEip1193Wallet = $derived(
		selectedWallet?.connection.transport === WalletConnectionTransport.Eip1193
			? selectedWallet.wallet
			: null,
	)
	const bridgeSettings = $derived(
		bridgeSettingsState.current ?? defaultBridgeSettings,
	)
	const settings = $derived(swapSettingsState.current ?? defaultSwapSettings)
	const quoteParams = $derived(
		settings.amount > 0n
			? ({
					chainId: settings.chainId,
					tokenIn: settings.tokenIn,
					tokenOut: settings.tokenOut,
					amountIn: settings.amount,
					slippage: settings.slippage,
				} satisfies FetchSwapQuoteParams)
			: null,
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

	const filteredNetworks = $derived(
		networks.filter((n) =>
			bridgeSettings.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const network = $derived(
		settings.chainId ? networksByChainId[settings.chainId] : null,
	)
	const chainTokens = $derived(
		(tokenListQuery.data ?? [])
			.map((r) => r.row)
			.filter((token) => token.chainId === settings.chainId),
	)
	const tokenInEntry = $derived(
		chainTokens.find(
			(token) => token.address.toLowerCase() === settings.tokenIn.toLowerCase(),
		) ?? null,
	)
	const tokenOutEntry = $derived(
		chainTokens.find(
			(token) =>
				token.address.toLowerCase() === settings.tokenOut.toLowerCase(),
		) ?? null,
	)
	const tokenInDecimals = $derived(tokenInEntry?.decimals ?? 18)
	const tokenOutDecimals = $derived(tokenOutEntry?.decimals ?? 18)
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
		network && selectedActor
			? (balances.find(
					(b) =>
						b.$id.chainId === network.id &&
						b.$id.tokenAddress.toLowerCase() === settings.tokenIn.toLowerCase(),
				)?.balance ?? null)
			: null,
	)
	const routerAddress = $derived(
		UNIVERSAL_ROUTER_ADDRESS[settings.chainId] ?? null,
	)
	const needsApproval = $derived(Boolean(routerAddress && settings.amount > 0n))
	const allowanceRow = $derived(
		selectedActor && network && routerAddress
			? (allowancesQuery.data?.find(
					(r) =>
						r.row.$id.chainId === network.id &&
						r.row.$id.address.toLowerCase() === selectedActor.toLowerCase() &&
						r.row.$id.tokenAddress.toLowerCase() ===
							settings.tokenIn.toLowerCase() &&
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
			(hasSufficientAllowance || !needsApproval) &&
			quote &&
			selectedEip1193Wallet,
	)
	const priceImpactWarning = $derived(quote ? quote.priceImpact > 1 : false)
	const storkPrices = $derived((storkPricesQuery.data ?? []).map((r) => r.row))
	const tokenInAssetId = $derived(
		tokenInEntry ? getStorkAssetIdForSymbol(tokenInEntry.symbol) : null,
	)
	const tokenOutAssetId = $derived(
		tokenOutEntry ? getStorkAssetIdForSymbol(tokenOutEntry.symbol) : null,
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
		tokenInPriceRow &&
		tokenOutPriceRow &&
		tokenOutPriceRow.price !== 0n
			? (tokenInPriceRow.price * 10n ** 18n) / tokenOutPriceRow.price
			: null,
	)
	const quoteRate = $derived(
		quote && settings.amount > 0n
			? (quote.amountOut * 10n ** 18n * 10n ** BigInt(tokenInDecimals)) /
					(settings.amount * 10n ** BigInt(tokenOutDecimals))
			: null,
	)
	const rateDeltaBps = $derived(
		storkRate &&
		storkRate !== 0n &&
		quoteRate
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

	let executing = $state(false)
	let executionRef = $state<{ execute: () => Promise<void> } | null>(null)
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

	const onAmountInput = (e: Event) => {
		const v = (e.target as HTMLInputElement).value
			.replace(/[^0-9.,]/g, '')
			.replace(/,/g, '')
		if (v === '') swapSettingsState.current = { ...settings, amount: 0n }
		else if (isValidDecimalInput(v, tokenInDecimals))
			swapSettingsState.current = {
				...settings,
				amount: parseDecimalToSmallest(v, tokenInDecimals),
			}
	}
	const normalizeSelectValue = (
		value: string | string[] | null | undefined,
	): string | null =>
		Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
	const onTokenInChange = (value: string) => {
		const nextToken = chainTokens.find(
			(token) => token.address === value,
		)?.address
		if (!nextToken) return
		if (nextToken === settings.tokenOut) swapDirection()
		else swapSettingsState.current = { ...settings, tokenIn: nextToken }
	}
	const onTokenOutChange = (value: string) => {
		const nextToken = chainTokens.find(
			(token) => token.address === value,
		)?.address
		if (!nextToken) return
		if (nextToken === settings.tokenIn) swapDirection()
		else swapSettingsState.current = { ...settings, tokenOut: nextToken }
	}
	const swapDirection = () => {
		swapSettingsState.current = {
			...settings,
			tokenIn: settings.tokenOut,
			tokenOut: settings.tokenIn,
			amount: 0n,
		}
	}
	const formatSlippage = (s: number) => `${(s * 100).toFixed(2)}%`

	$effect(() => {
		const nextChainId = filteredNetworks[0]?.id
		if (!nextChainId) return
		if (filteredNetworks.some((n) => n.id === settings.chainId)) return
		swapSettingsState.current = { ...settings, chainId: nextChainId }
	})

	$effect(() => {
		if (chainTokens.length === 0) return
		const tokenInMatch = chainTokens.find(
			(token) => token.address.toLowerCase() === settings.tokenIn.toLowerCase(),
		)
		const tokenOutMatch = chainTokens.find(
			(token) =>
				token.address.toLowerCase() === settings.tokenOut.toLowerCase(),
		)
		const nextTokenIn = tokenInMatch?.address ?? chainTokens[0]?.address
		const nextTokenOut =
			tokenOutMatch?.address ??
			chainTokens.find((token) => token.address !== nextTokenIn)?.address ??
			nextTokenIn
		if (!nextTokenIn || !nextTokenOut) return
		if (nextTokenIn === settings.tokenIn && nextTokenOut === settings.tokenOut)
			return
		swapSettingsState.current = {
			...settings,
			tokenIn: nextTokenIn,
			tokenOut: nextTokenOut,
		}
	})

	$effect(() => {
		if (!selectedActor || !network || !tokenInEntry) return
		void fetchActorCoinBalance(
			{
				chainId: network.id,
				address: selectedActor,
				tokenAddress: tokenInEntry.address,
			},
			tokenInEntry.symbol,
			tokenInEntry.decimals,
		)
		if (!tokenOutEntry || tokenOutEntry.address === tokenInEntry.address) return
		void fetchActorCoinBalance(
			{
				chainId: network.id,
				address: selectedActor,
				tokenAddress: tokenOutEntry.address,
			},
			tokenOutEntry.symbol,
			tokenOutEntry.decimals,
		)
	})
</script>

<section data-card data-column="gap-4">
	{#snippet tokenItem(token: TokenListCoinRow)}
		{token.symbol} <small data-muted>{token.name}</small>
	{/snippet}

	{#snippet swapSummary()}
		{#if quote}
			<div data-row="gap-1 align-center wrap">
				<span data-row-item="wrap-start">
					{formatSmallestToDecimal(settings.amount, tokenInDecimals, 4)}
					{tokenInEntry?.symbol ?? '—'} -> {formatSmallestToDecimal(
						quote.amountOut,
						tokenOutDecimals,
						4,
					)}
					{tokenOutEntry?.symbol ?? '—'}
				</span>
			</div>
			<div data-row="gap-2 align-center wrap" data-muted>
				<span>Price impact: {quote.priceImpact.toFixed(2)}%</span>
				{#if priceImpactWarning}<span data-error>High impact</span>{/if}
				<Popover.Root>
					<Popover.Trigger data-row="gap-1"
						>Slippage: <strong>{formatSlippage(settings.slippage)}</strong
						></Popover.Trigger
					>
					<Popover.Content data-column="gap-2">
						<input
							type="number"
							step="0.1"
							value={settings.slippage * 100}
							oninput={(e) => {
								const v = parseFloat((e.target as HTMLInputElement).value)
								if (!Number.isNaN(v) && v >= 0 && v <= 50)
									swapSettingsState.current = { ...settings, slippage: v / 100 }
							}}
						/>
					</Popover.Content>
				</Popover.Root>
			</div>
			{#if tokenInPriceRow && tokenOutPriceRow}
				<div data-row="gap-2 align-center wrap" data-muted>
					<span>
						Stork: 1 {tokenInEntry?.symbol ?? '—'} ≈ {formatSmallestToDecimal(
							storkRate ?? 0n,
							18,
							6,
						)}
						{tokenOutEntry?.symbol ?? '—'}
					</span>
					{#if quoteRate !== null}
						<span>
							Quote: 1 {tokenInEntry?.symbol ?? '—'} ≈ {formatSmallestToDecimal(
								quoteRate,
								18,
								6,
							)}
							{tokenOutEntry?.symbol ?? '—'}
						</span>
						{#if rateDeltaPercent !== null}
							<span>Δ {rateDeltaPercent.toFixed(2)}%</span>
						{/if}
					{/if}
				</div>
			{/if}
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

	<div data-row="gap-2">
		<div data-row-item="flexible" data-card="secondary" data-column="gap-1">
			<div data-row="gap-2 align-center wrap">
				<label for="swap-amount-in">From</label>
			</div>
			<div data-row="gap-2 align-center wrap">
				<input
					id="swap-amount-in"
					type="text"
					inputmode="decimal"
					placeholder="0.00"
					value={settings.amount === 0n
						? ''
						: formatSmallestToDecimal(settings.amount, tokenInDecimals)}
					oninput={onAmountInput}
					data-row-item="flexible"
				/>
				<div data-row-item="basis-3">
					<Select
						items={chainTokens}
						value={settings.tokenIn}
						onValueChange={(v) => {
							const nextValue = normalizeSelectValue(v)
							if (nextValue) onTokenInChange(nextValue)
						}}
						getItemId={(token) => token.address}
						getItemLabel={(token) => token.symbol}
						placeholder="Select token"
						id="swap-token-in"
						ariaLabel="Token in"
						Item={tokenItem}
					/>
				</div>
			</div>
			{#if tokenInBalance !== null}
				<small data-muted
					>Balance: {formatSmallestToDecimal(
						tokenInBalance,
						tokenInDecimals,
						4,
					)}
					{tokenInEntry?.symbol ?? ''}</small
				>
			{/if}
		</div>
		<div data-row="center">
			<Button.Root
				type="button"
				onclick={swapDirection}
				aria-label="Swap direction">↕</Button.Root
			>
		</div>
		<div data-row-item="flexible" data-card="secondary" data-column="gap-1">
			<div data-row="gap-2 align-center wrap">
				<span aria-hidden="true">To</span>
			</div>
			<div data-row="gap-2 align-center wrap">
				<div data-row-item="flexible" data-muted>
					{#if quote}
						{formatSmallestToDecimal(quote.amountOut, tokenOutDecimals, 4)}
					{:else if quoteParams}
						—
					{:else}
						0
					{/if}
				</div>
				<div data-row-item="basis-3">
					<Select
						items={chainTokens}
						value={settings.tokenOut}
						onValueChange={(v) => {
							const nextValue = normalizeSelectValue(v)
							if (nextValue) onTokenOutChange(nextValue)
						}}
						getItemId={(token) => token.address}
						getItemLabel={(token) => token.symbol}
						placeholder="Select token"
						id="swap-token-out"
						ariaLabel="Token out"
						Item={tokenItem}
					/>
				</div>
			</div>
		</div>
	</div>

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
			Boolean(canSwap && selectedActor && selectedEip1193Wallet) && !executing,
						execute: (_args) =>
							executionRef ? executionRef.execute() : Promise.resolve(),
						Details: swapDetails,
					},
				]
			: []}
	/>
</section>
