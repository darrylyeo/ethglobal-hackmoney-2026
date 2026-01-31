<script lang='ts'>
	// Types/constants
	import type { NormalizedQuote } from '$/api/lifi'
	import type { LiFiStep } from '@lifi/sdk'
	import type { WalletState } from '$/lib/wallet'
	import type { BridgeError } from '$/lib/errors'

	// Functions
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { Button } from 'bits-ui'
	import { networksCollection } from '$/collections/networks'
	import { actorCoinsCollection, fetchAllBalancesForAddress } from '$/collections/actor-coins'
	import {
		executeQuoteWithStatus,
		fetchQuoteCached,
	} from '$/api/lifi'
	import { createInitialStatus } from '$/lib/tx-status'
	import {
		extractRouteLimits,
		USDC_MIN_AMOUNT,
		USDC_MAX_AMOUNT,
	} from '$/constants/bridge-limits'
	import { categorizeError, ErrorCode, isBridgeError } from '$/lib/errors'
	import {
		formatTokenAmount,
		parseDecimalToSmallest,
	} from '$/lib/format'

	// Components
	import ChainIdSection from './ChainIdSection.svelte'
	import ChainSwitchPrompt from './ChainSwitchPrompt.svelte'
	import ErrorDisplay from './ErrorDisplay.svelte'
	import QuoteForm from './QuoteForm.svelte'
	import QuoteOutput from './QuoteOutput.svelte'
	import RecipientInput from './RecipientInput.svelte'
	import TransactionStatus from './TransactionStatus.svelte'
	import WalletProvider from './WalletProvider.svelte'

	// State
	const networksQuery = useLiveQuery((q) =>
		q
			.from({ network: networksCollection })
			.orderBy(({ network }) => network.id)
			.select(({ network }) => ({ network })),
	)
	const networks = $derived(
		(networksQuery.data ?? []).map((row) => row.network),
	)
	const networkItems = $derived(
		networks.map((n) => ({ value: String(n.id), label: n.name })),
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
	let quote = $state<NormalizedQuote | null>(null)
	let quoteStep = $state<LiFiStep | null>(null)
	let quoteError = $state<BridgeError | null>(null)
	let quoteRetryAttempt = $state(1)
	let quoteLoading = $state(false)
	let execLoading = $state(false)
	let execError = $state<BridgeError | null>(null)
	let execRetryAttempt = $state(1)
	let execTxHashes = $state<string[]>([])
	let bridgeStatus = $state(createInitialStatus())
	let lastFetchedAddress = $state<string | null>(null)

	// Actions
	const fetchBalances = async (wallet: WalletState) => {
		if (!wallet.address || lastFetchedAddress === wallet.address) return
		lastFetchedAddress = wallet.address
		await fetchAllBalancesForAddress(wallet.address)
	}

	const getQuote = async (wallet: WalletState) => {
		if (!wallet.address) return
		quoteError = null
		quote = null
		quoteStep = null
		quoteLoading = true
		try {
			const result = await fetchQuoteCached({
				fromChain: Number(fromChain),
				toChain: Number(toChain),
				fromAmount: parseDecimalToSmallest(amount, 6).toString(),
				fromAddress: wallet.address,
				toAddress: recipient,
			})
			quote = result.quote
			quoteStep = result.step
		} catch (e) {
			quoteError = isBridgeError(e) ? e : categorizeError(e)
		} finally {
			quoteLoading = false
		}
	}

	const sendTransaction = async (wallet: WalletState) => {
		if (!wallet.connectedDetail || !wallet.address || !quote) return
		execError = null
		execTxHashes = []
		execLoading = true
		bridgeStatus = createInitialStatus()
		try {
			const route = await executeQuoteWithStatus(
				wallet.connectedDetail,
				{
					fromChain: Number(fromChain),
					toChain: Number(toChain),
					fromAmount: parseDecimalToSmallest(amount, 6).toString(),
					fromAddress: wallet.address,
					toAddress: recipient,
				},
				(s) => {
					bridgeStatus = s
					const hashes = s.steps
						.map((t) => t.txHash)
						.filter((h): h is string => Boolean(h))
					if (hashes.length > 0) execTxHashes = hashes
				},
			)
			const hashes = route.steps
				.flatMap((s) => s.execution?.process ?? [])
				.map((p) => (p as { txHash?: string }).txHash)
				.filter((h): h is string => Boolean(h))
			if (hashes.length > 0) execTxHashes = hashes
		} catch (e) {
			execError = isBridgeError(e) ? e : categorizeError(e)
		} finally {
			execLoading = false
		}
	}
</script>

<svelte:head>
	<title>USDC Bridge</title>
</svelte:head>

<WalletProvider>
	{#snippet children(wallet)}
		{@const _ = wallet.address ? fetchBalances(wallet) : (lastFetchedAddress = null)}
		<main data-column='gap-6'>
			<h1>USDC Bridge</h1>

			{#if wallet.address}
				<section data-card data-column='gap-4' aria-labelledby='balances-heading'>
					<h2 id='balances-heading'>Your USDC Balances</h2>
					{#if actorCoins.length === 0}
						<p>Loading balances…</p>
					{:else}
						<div data-balances-grid>
							{#each actorCoins.filter((ac) => ac.address === wallet.address) as ac (`${ac.chainId}-${ac.address}-${ac.coinAddress}`)}
								{@const network = networks.find((n) => n.id === ac.chainId)}
								<div data-balance-item data-loading={ac.isLoading ? '' : undefined}>
									<span data-balance-network>{network?.name ?? `Chain ${ac.chainId}`}</span>
									<span data-balance-amount>
										{#if ac.isLoading}
											…
										{:else if ac.error}
											<span data-balance-error title={ac.error}>Error</span>
										{:else}
											{ac.balanceFormatted} {ac.coinSymbol}
										{/if}
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</section>
			{/if}

			<section data-card data-column='gap-4' aria-labelledby='quote-heading'>
				<h2 id='quote-heading'>Get quote</h2>
				<svelte:boundary>
					{#if !wallet.address}
						<p>Connect a wallet to get a quote.</p>
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
							{networkItems}
							bind:fromChain
							bind:toChain
							bind:amount
							fromAddress={wallet.address}
							balance={sourceBalance}
							loading={quoteLoading}
							onSubmit={() => getQuote(wallet)}
						/>
						<RecipientInput
							walletAddress={wallet.address}
							toChainId={Number(toChain)}
							bind:recipient
						/>
					{/if}
					{#if quoteError?.code === ErrorCode.NO_ROUTES}
						<div data-no-routes>
							<p>No routes available for this transfer.</p>
							<ul>
								<li>Try a different amount (min ~1 USDC, max varies by route)</li>
								<li>Try a different chain pair</li>
								<li>Check if the bridge is operational</li>
							</ul>
						</div>
					{:else if quoteError}
						<ErrorDisplay
							error={quoteError}
							attempt={quoteRetryAttempt}
							onRetry={() => {
								quoteRetryAttempt++
								getQuote(wallet)
							}}
							onDismiss={() => {
								quoteError = null
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
					{:else if quote}
						{@const limits = extractRouteLimits([quote])}
						{@const minDisplay = limits.minAmount ?? USDC_MIN_AMOUNT}
						{@const maxDisplay = limits.maxAmount ?? USDC_MAX_AMOUNT}
						<p data-route-limits>
							Min: {formatTokenAmount(String(minDisplay), 6)} USDC
							Max: {formatTokenAmount(String(maxDisplay), 6)} USDC
						</p>
						<QuoteOutput
							{quote}
							quoteStep={quoteStep}
							connectedDetail={wallet.connectedDetail}
							execLoading={execLoading}
							execError={execError}
							execRetryAttempt={execRetryAttempt}
							execTxHashes={execTxHashes}
							onSendTransaction={() => sendTransaction(wallet)}
							onDismissExecError={() => {
								execError = null
							}}
							onRetryExec={() => {
								execRetryAttempt++
								sendTransaction(wallet)
							}}
						/>
						<TransactionStatus
							status={bridgeStatus}
							fromChainId={Number(fromChain)}
							toChainId={Number(toChain)}
						/>
					{/if}

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
		</main>
	{/snippet}
</WalletProvider>

<style>
	[data-balances-grid] {
		display: grid
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))
		gap: 0.75em
	}

	[data-balance-item] {
		display: flex
		flex-direction: column
		gap: 0.25em
		padding: 0.75em
		background: var(--color-bg-page)
		border-radius: 0.5em
		border: 1px solid var(--color-border)
	}

	[data-balance-item][data-loading] {
		opacity: 0.6
	}

	[data-balance-network] {
		font-size: 0.75em
		opacity: 0.7
	}

	[data-balance-amount] {
		font-weight: 600
		font-variant-numeric: tabular-nums
	}

	[data-balance-error] {
		color: var(--color-error, #ef4444)
		font-size: 0.875em
	}
</style>
