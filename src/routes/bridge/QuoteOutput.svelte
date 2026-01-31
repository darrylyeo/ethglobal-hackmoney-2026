<script lang='ts'>
	// Types/constants
	import type { NormalizedQuote, NormalizedRoute } from '$/api/lifi'
	import type { LiFiStep } from '@lifi/sdk'
	import type { ProviderDetailType } from '$/lib/wallet'
	import type { BridgeError } from '$/lib/errors'

	// Functions
	import { extractFeeBreakdown } from '$/api/lifi'
	import { Button } from 'bits-ui'
	import { formatTokenAmount } from '$/lib/format'

	// Components
	import ErrorDisplay from './ErrorDisplay.svelte'
	import FeeBreakdown from './FeeBreakdown.svelte'

	// Props
	let {
		quote = null,
		quoteStep = null,
		route = null,
		connectedDetail,
		execLoading = false,
		execError = null,
		execRetryAttempt = 1,
		execTxHashes = [],
		showSendButton = true,
		onSendTransaction,
		onDismissExecError,
		onRetryExec,
	}: {
		quote?: NormalizedQuote | null
		quoteStep?: LiFiStep | null
		route?: NormalizedRoute | null
		connectedDetail: ProviderDetailType | null
		execLoading?: boolean
		execError?: BridgeError | null
		execRetryAttempt?: number
		execTxHashes?: string[]
		showSendButton?: boolean
		onSendTransaction: () => void
		onDismissExecError?: () => void
		onRetryExec?: () => void
	} = $props()

	const estimatedToAmount = $derived(
		route?.toAmount ?? quote?.estimatedToAmount ?? '0',
	)
	const stepCount = $derived(route?.steps.length ?? quote?.steps.length ?? 0)
	const fees = $derived(
		route
			? extractFeeBreakdown({
					steps: route.originalRoute.steps,
					fromAmountUSD: route.originalRoute.fromAmountUSD,
				})
			: quoteStep
				? extractFeeBreakdown({
						steps: [quoteStep],
						fromAmountUSD: quoteStep.estimate?.fromAmountUSD,
					})
				: null,
	)
</script>

<output data-column='gap-2' data-testid='quote-result' for='from-chain to-chain amount from-address'>
	<p>
		<strong>Estimated output:</strong> {formatTokenAmount(estimatedToAmount, 6)} USDC
		(steps: {stepCount})
	</p>
	{#if fees}
		<FeeBreakdown fees={fees} expanded={true} />
	{:else if quote?.fees.length > 0}
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
		{#if showSendButton}
			<Button.Root
				type='button'
				disabled={execLoading}
				aria-busy={execLoading || undefined}
				aria-describedby={execLoading ? 'send-loading-status' : undefined}
				onclick={onSendTransaction}
			>
				{#if execLoading}
					<span id='send-loading-status' class='sr-only'>Sending transaction, please wait</span>
				{/if}
				{execLoading ? 'Sending…' : 'Send transaction'}
			</Button.Root>
		{/if}
	{:else}
		<p>Connect a wallet above to send the transaction.</p>
	{/if}
	{#if execError}
		<ErrorDisplay
			error={execError}
			attempt={execRetryAttempt}
			onRetry={onRetryExec}
			onDismiss={onDismissExecError}
		/>
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
