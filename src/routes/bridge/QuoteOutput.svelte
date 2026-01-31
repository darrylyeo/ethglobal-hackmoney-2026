<script lang='ts'>
	// Types/constants
	import type { NormalizedQuote } from '$/api/lifi'
	import type { ProviderDetailType } from '$/lib/wallet'

	// Functions
	import { Button } from 'bits-ui'
	import { formatTokenAmount } from '$/lib/format'

	// Props
	let {
		quote,
		connectedDetail,
		execLoading = false,
		execError = null,
		execTxHashes = [],
		onSendTransaction,
	}: {
		quote: NormalizedQuote
		connectedDetail: ProviderDetailType | null
		execLoading?: boolean
		execError?: string | null
		execTxHashes?: string[]
		onSendTransaction: () => void
	} = $props()
</script>

<output data-column='gap-2' data-testid='quote-result' for='from-chain to-chain amount from-address'>
	<p>
		<strong>Estimated output:</strong> {formatTokenAmount(quote.estimatedToAmount, 6)} USDC
		(steps: {quote.steps.length})
	</p>
	{#if quote.fees.length > 0}
		<p>
			Fees: {quote.fees
				.map((f) => {
					const decimals = f.token.decimals ?? (f.token.symbol === 'ETH' ? 18 : 6)
					return `${formatTokenAmount(f.amount, decimals)} ${f.token.symbol}`
				})
				.join(', ')}
		</p>
	{/if}
	{#if connectedDetail}
		<Button.Root
			type='button'
			disabled={execLoading}
			onclick={onSendTransaction}
		>
			{execLoading ? 'Sending…' : 'Send transaction'}
		</Button.Root>
	{:else}
		<p>Connect a wallet above to send the transaction.</p>
	{/if}
	{#if execError}
		<p role='alert'>{execError}</p>
	{/if}
	{#if execTxHashes.length > 0}
		<p data-column='gap-1'>
			<strong>Tx:</strong>
			{#each execTxHashes as hash (hash)}
				<a data-link href={`https://etherscan.io/tx/${hash}`} target='_blank' rel='noopener noreferrer'>{hash.slice(0, 10)}…</a>
			{/each}
		</p>
	{/if}
</output>
