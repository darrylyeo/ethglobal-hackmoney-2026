<script lang='ts'>
	// Types/constants
	import type { NormalizedQuote } from '$/api/lifi'
	import type { WalletState } from '$/lib/wallet'

	// Functions
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { Button } from 'bits-ui'
	import { networksCollection } from '$/collections/networks'
	import { actorCoinsCollection, fetchAllBalancesForAddress } from '$/collections/actor-coins'
	import { executeQuote, fetchQuoteCached } from '$/api/lifi'

	// Components
	import ChainIdSection from './ChainIdSection.svelte'
	import QuoteForm from './QuoteForm.svelte'
	import QuoteOutput from './QuoteOutput.svelte'
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
	let amount = $state('1000000')
	let quote = $state<NormalizedQuote | null>(null)
	let quoteError = $state<string | null>(null)
	let quoteLoading = $state(false)
	let execLoading = $state(false)
	let execError = $state<string | null>(null)
	let execTxHashes = $state<string[]>([])
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
		quoteLoading = true
		try {
			quote = await fetchQuoteCached({
				fromChain: Number(fromChain),
				toChain: Number(toChain),
				fromAmount: amount,
				fromAddress: wallet.address,
			})
		} catch (e) {
			quoteError = e instanceof Error ? e.message : String(e)
		} finally {
			quoteLoading = false
		}
	}

	const sendTransaction = async (wallet: WalletState) => {
		if (!wallet.connectedDetail || !wallet.address || !quote) return
		execError = null
		execTxHashes = []
		execLoading = true
		try {
			const route = await executeQuote(
				wallet.connectedDetail,
				{
					fromChain: Number(fromChain),
					toChain: Number(toChain),
					fromAmount: amount,
					fromAddress: wallet.address,
				},
				{
					updateRouteHook(route) {
						const hashes = route.steps
							.flatMap((s) => s.execution?.process ?? [])
							.map((p) => (p as { txHash?: string }).txHash)
							.filter((h): h is string => Boolean(h))
						if (hashes.length > 0) execTxHashes = hashes
					},
				},
			)
			const hashes = route.steps
				.flatMap((s) => s.execution?.process ?? [])
				.map((p) => (p as { txHash?: string }).txHash)
				.filter((h): h is string => Boolean(h))
			if (hashes.length > 0) execTxHashes = hashes
		} catch (e) {
			execError = e instanceof Error ? e.message : String(e)
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
						<QuoteForm
							{networkItems}
							bind:fromChain
							bind:toChain
							bind:amount
							fromAddress={wallet.address}
							loading={quoteLoading}
							onSubmit={() => getQuote(wallet)}
						/>
					{/if}
					{#if quoteError}
						<p role='alert'>{quoteError}</p>
					{/if}
					{#if quote}
						<QuoteOutput
							{quote}
							connectedDetail={wallet.connectedDetail}
							execLoading={execLoading}
							execError={execError}
							execTxHashes={execTxHashes}
							onSendTransaction={() => sendTransaction(wallet)}
						/>
					{/if}

					{#snippet failed(error, reset)}
						<div data-row='gap-2 align-center'>
							<p role='alert'>{error instanceof Error ? error.message : String(error)}</p>
							<Button.Root type='button' onclick={reset}>Try again</Button.Root>
						</div>
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
