<script lang="ts">
	// Types/constants
	import type { NormalizedQuote } from '$/lib/lifi'

	// Functions
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { Select, Button } from 'bits-ui'
	import { networksCollection } from '$/collections/networks'
	import { fetchQuoteCached } from '$/lib/lifi'

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

	let fromChain = $state(String(1))
	let toChain = $state(String(10))
	let amount = $state('1000000')
	let fromAddress = $state('0x0000000000000000000000000000000000000001')
	let quote = $state<NormalizedQuote | null>(null)
	let quoteLoading = $state(false)
	let quoteError = $state<string | null>(null)

	let rpcUrl = $state('')
	let chainIdResult = $state<string | null>(null)
	let chainIdLoading = $state(false)
	let chainIdError = $state<string | null>(null)

	// Actions
	async function getQuote() {
		quoteError = null
		quote = null
		quoteLoading = true
		try {
			const addr = fromAddress.startsWith('0x')
				? (fromAddress as `0x${string}`)
				: (`0x${fromAddress}` as `0x${string}`)
			quote = await fetchQuoteCached({
				fromChain: Number(fromChain),
				toChain: Number(toChain),
				fromAmount: amount,
				fromAddress: addr,
			})
		} catch (e) {
			quoteError = e instanceof Error ? e.message : String(e)
		} finally {
			quoteLoading = false
		}
	}

	async function getChainIdFromRpc() {
		if (!rpcUrl.trim()) return
		chainIdError = null
		chainIdResult = null
		chainIdLoading = true
		try {
			const res = await fetch('/api/chain-id', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rpcUrl: rpcUrl.trim() }),
			})
			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: res.statusText }))
				throw new Error(err.message ?? res.statusText)
			}
			const { chainId } = await res.json()
			chainIdResult = String(chainId)
		} catch (e) {
			chainIdError = e instanceof Error ? e.message : String(e)
		} finally {
			chainIdLoading = false
		}
	}
</script>

<svelte:head>
	<title>USDC Bridge</title>
</svelte:head>

<div data-column="gap-6">
	<h1>USDC Bridge</h1>

	<section data-card data-column="gap-4">
		<h2>Get quote</h2>
		<svelte:boundary>
			{#if networksQuery.isLoading}
				<p>Loading networks…</p>
			{:else}
				<form
					data-column="gap-4"
					onsubmit={(e) => {
						e.preventDefault()
						getQuote()
					}}
				>
					<div data-row="gap-4">
						<div data-column="gap-2">
							<label for="from-chain">From chain</label>
							<Select.Root
								type="single"
								bind:value={fromChain}
								items={networkItems}
								name="fromChain"
							>
								<Select.Trigger id="from-chain" aria-label="From chain">
									{networkItems.find((i) => i.value === fromChain)?.label ?? 'Select'}
								</Select.Trigger>
								<Select.Portal>
									<Select.Content>
										<Select.Viewport>
											{#each networkItems as item, i (`from-${i}-${item.value}`)}
												<Select.Item value={item.value} label={item.label}>
													<span data-testid={`option-${item.label}`}>{item.label}</span>
												</Select.Item>
											{/each}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</div>
						<div data-column="gap-2">
							<label for="to-chain">To chain</label>
							<Select.Root
								type="single"
								bind:value={toChain}
								items={networkItems}
								name="toChain"
							>
								<Select.Trigger id="to-chain" aria-label="To chain">
									{networkItems.find((i) => i.value === toChain)?.label ?? 'Select'}
								</Select.Trigger>
								<Select.Portal>
									<Select.Content>
										<Select.Viewport>
											{#each networkItems as item, i (`to-${i}-${item.value}`)}
												<Select.Item value={item.value} label={item.label}>
													<span data-testid={`option-${item.label}`}>{item.label}</span>
												</Select.Item>
											{/each}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</div>
					</div>
					<div data-column="gap-2">
						<label for="amount">Amount (smallest units)</label>
						<input id="amount" type="text" bind:value={amount} />
					</div>
					<div data-column data-column="gap-2">
						<label for="from-address">From address</label>
						<input id="from-address" type="text" bind:value={fromAddress} />
					</div>
					<Button.Root type="submit" disabled={quoteLoading}>
						{quoteLoading ? 'Loading…' : 'Get Quote'}
					</Button.Root>
				</form>
			{/if}
			{#if quoteError}
				<p role="alert">{quoteError}</p>
			{/if}
			{#if quote}
				<div data-column data-column="gap-2">
					<p data-testid="quote-result">
						<strong>Estimated output:</strong> {quote.estimatedToAmount} (steps: {quote.steps.length})
					</p>
					{#if quote.fees.length > 0}
						<p>Fees: {quote.fees.map((f) => `${f.amount} ${f.token.symbol}`).join(', ')}</p>
					{/if}
				</div>
			{/if}

			{#snippet failed(error, reset)}
				<div data-row data-row="gap-2 align-center">
					<p role="alert">{error instanceof Error ? error.message : String(error)}</p>
					<Button.Root type="button" onclick={reset}>Try again</Button.Root>
				</div>
			{/snippet}
		</svelte:boundary>
	</section>

	<section data-card data-column data-column="gap-4">
		<h2>Chain ID (Voltaire)</h2>
		<div data-row data-row="gap-2">
			<div data-column data-column="gap-2" data-row-item="flexible">
				<label for="rpc-url">RPC URL</label>
				<input id="rpc-url" type="url" bind:value={rpcUrl} placeholder="https://…" />
			</div>
			<Button.Root type="button" disabled={chainIdLoading || !rpcUrl.trim()} onclick={getChainIdFromRpc}>
				{chainIdLoading ? 'Loading…' : 'Get chain ID'}
			</Button.Root>
		</div>
		{#if chainIdError}
			<p role="alert">{chainIdError}</p>
		{/if}
		{#if chainIdResult !== null}
			<p>Chain ID: {chainIdResult}</p>
		{/if}
	</section>
</div>
