<script lang="ts">
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { Button, Popover, Select } from 'bits-ui'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { ChainId, NetworkType, networks, networksByChainId } from '$/constants/networks'
	import { UNIVERSAL_ROUTER_ADDRESS } from '$/constants/uniswap'
	import { swapSettingsState, defaultSwapSettings } from '$/state/swap-settings.svelte'
	import { swapQuotesCollection, fetchSwapQuote, type FetchSwapQuoteParams } from '$/collections/swap-quotes'
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import { actorAllowancesCollection } from '$/collections/actor-allowances'
	import { transactionsCollection } from '$/collections/transactions'
	import { getSwapQuote, getSwapQuoteId } from '$/api/uniswap'
	import { formatSmallestToDecimal, parseDecimalToSmallest, isValidDecimalInput } from '$/lib/format'
	import { debounce } from '$/lib/debounce'
	import { switchWalletChain } from '$/lib/wallet'
	import TokenApproval from '$/routes/bridge/TokenApproval.svelte'
	import SwapExecution from './SwapExecution.svelte'

	let {
		selectedWallets,
		selectedActor,
		selectedChainId,
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
		selectedChainId: number | null
	} = $props()

	const selectedWallet = $derived(selectedWallets.find((w) => w.connection.selected) ?? null)
	const settings = $derived(swapSettingsState.current ?? defaultSwapSettings)
	const quoteParams = $derived(
		settings.amount > 0n
			? {
				chainId: settings.chainId,
				tokenIn: settings.tokenIn,
				tokenOut: settings.tokenOut,
				amountIn: settings.amount,
				slippage: settings.slippage,
			} satisfies FetchSwapQuoteParams
			: null
	)

	const quotesQuery = useLiveQuery((q) => q.from({ row: swapQuotesCollection }).select(({ row }) => ({ row })))
	const balancesQuery = useLiveQuery((q) => q.from({ row: actorCoinsCollection }).select(({ row }) => ({ row })))
	const allowancesQuery = useLiveQuery((q) => q.from({ row: actorAllowancesCollection }).select(({ row }) => ({ row })))
	const txQuery = useLiveQuery((q) => q.from({ row: transactionsCollection }).orderBy(({ row }) => row.$id?.createdAt ?? 0, 'desc').select(({ row }) => ({ row })))

	const filteredNetworks = $derived(networks.filter((n) => n.type === NetworkType.Mainnet))
	const network = $derived(settings.chainId ? networksByChainId[settings.chainId] : null)
	const quoteRow = $derived(
		quoteParams
			? (quotesQuery.data?.find((r) => r.row.id === getSwapQuoteId(quoteParams))?.row ?? null)
			: null
	)
	const quote = $derived(quoteRow ?? null)
	const balances = $derived(
		selectedActor
			? (balancesQuery.data ?? []).map((r) => r.row).filter((b) => b.$id.address.toLowerCase() === selectedActor!.toLowerCase())
			: []
	)
	const tokenInBalance = $derived(
		network && selectedActor
			? balances.find((b) => b.$id.chainId === network.id && b.$id.tokenAddress.toLowerCase() === settings.tokenIn.toLowerCase())?.balance ?? null
			: null
	)
	const routerAddress = $derived(UNIVERSAL_ROUTER_ADDRESS[settings.chainId] ?? null)
	const needsApproval = $derived(Boolean(routerAddress && settings.amount > 0n))
	const allowanceRow = $derived(
		selectedActor && network && routerAddress
			? allowancesQuery.data?.find((r) => (
				r.row.$id.chainId === network.id &&
				r.row.$id.address.toLowerCase() === selectedActor!.toLowerCase() &&
				r.row.$id.tokenAddress.toLowerCase() === settings.tokenIn.toLowerCase() &&
				r.row.$id.spenderAddress.toLowerCase() === routerAddress.toLowerCase()
			))?.row ?? null
			: null
	)
	const hasSufficientAllowance = $derived(allowanceRow ? allowanceRow.allowance >= settings.amount : !needsApproval)
	const needsChainSwitch = $derived(Boolean(selectedWallet && selectedChainId !== null && network && selectedChainId !== network.id))
	const canSwap = $derived(settings.amount > 0n && (hasSufficientAllowance || !needsApproval) && !needsChainSwitch && quote)
	const priceImpactWarning = $derived(quote ? quote.priceImpact > 1 : false)

	let executing = $state(false)
	let executionRef = $state<{ execute: () => Promise<void> } | null>(null)
	const fetchQuote = debounce(() => {
		if (quoteParams) fetchSwapQuote(quoteParams, getSwapQuote).catch(() => {})
	}, 500)
	$effect(() => {
		if (quoteParams) { fetchQuote(); return () => fetchQuote.cancel() }
	})

	const onAmountInput = (e: Event) => {
		const v = (e.target as HTMLInputElement).value.replace(/[^0-9.,]/g, '').replace(/,/g, '')
		if (v === '') swapSettingsState.current = { ...settings, amount: 0n }
		else if (isValidDecimalInput(v, 18)) swapSettingsState.current = { ...settings, amount: parseDecimalToSmallest(v, 18) }
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
</script>

<div data-column="gap-4">
	<h2>Swap</h2>

	<div data-row="gap-4">
		<div data-column="gap-1" style="flex:1">
			<label for="swap-chain">Chain</label>
			<Select.Root
				type="single"
				value={String(settings.chainId)}
				onValueChange={(v) => { if (v) swapSettingsState.current = { ...settings, chainId: Number(v) } }}
				items={filteredNetworks.map((n) => ({ value: String(n.id), label: n.name }))}
			>
				<Select.Trigger id="swap-chain">{network?.name ?? '—'}</Select.Trigger>
				<Select.Portal>
					<Select.Content>
						<Select.Viewport>
							{#each filteredNetworks as n (n.id)}
								<Select.Item value={String(n.id)} label={n.name}>{n.name}</Select.Item>
							{/each}
						</Select.Viewport>
					</Select.Content>
				</Select.Portal>
			</Select.Root>
		</div>
	</div>

	<div data-card data-column="gap-2">
		<div data-column="gap-1">
			<label for="swap-amount-in">From</label>
			<input
				id="swap-amount-in"
				type="text"
				inputmode="decimal"
				placeholder="0.00"
				value={settings.amount === 0n ? '' : formatSmallestToDecimal(settings.amount, 6)}
				oninput={onAmountInput}
			/>
			{#if tokenInBalance !== null}
				<small data-muted>Balance: {formatSmallestToDecimal(tokenInBalance, 6, 4)}</small>
			{/if}
		</div>
		<Button.Root type="button" onclick={swapDirection} aria-label="Swap direction">↕</Button.Root>
		<div data-column="gap-1">
			<span aria-hidden="true">To</span>
			<div data-muted>
				{#if quote}
					{formatSmallestToDecimal(quote.amountOut, 6, 4)}
				{:else if quoteParams}
					—
				{:else}
					0
				{/if}
			</div>
		</div>
	</div>

	{#if quote}
		<div data-row="gap-2" data-muted>
			<span>Price impact: {quote.priceImpact.toFixed(2)}%</span>
			{#if priceImpactWarning}<span data-error>High impact</span>{/if}
		</div>
		<Popover.Root>
			<Popover.Trigger data-row="gap-1">Slippage: <strong>{formatSlippage(settings.slippage)}</strong></Popover.Trigger>
			<Popover.Content data-column="gap-2">
				<input
					type="number"
					step="0.1"
					value={settings.slippage * 100}
					oninput={(e) => {
						const v = parseFloat((e.target as HTMLInputElement).value)
						if (!Number.isNaN(v) && v >= 0 && v <= 50) swapSettingsState.current = { ...settings, slippage: v / 100 }
					}}
				/>
			</Popover.Content>
		</Popover.Root>
	{/if}

	{#if needsChainSwitch && network && selectedWallet}
		<div data-card="secondary" data-row="gap-2 align-center">
			<span>Switch to {network.name}</span>
			<Button.Root onclick={() => selectedWallet && switchWalletChain(selectedWallet.wallet.provider, network.id)}>Switch</Button.Root>
		</div>
	{/if}

	{#if needsApproval && selectedActor && selectedWallet && routerAddress}
		<TokenApproval
			chainId={settings.chainId}
			tokenAddress={settings.tokenIn}
			spenderAddress={routerAddress}
			amount={settings.amount}
			provider={selectedWallet.wallet.provider}
			ownerAddress={selectedActor}
		/>
	{/if}

	{#if quote && selectedActor && selectedWallet}
		<SwapExecution
			quote={quote}
			walletProvider={selectedWallet.wallet.provider}
			walletAddress={selectedActor}
			amount={settings.amount}
			bind:executing
			bind:this={executionRef}
		/>
		<Button.Root
			type="button"
			disabled={!canSwap || executing}
			onclick={() => executionRef?.execute()}
		>
			Swap
		</Button.Root>
	{/if}
</div>
