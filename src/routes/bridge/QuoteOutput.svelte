<script lang='ts'>
	// Types/constants
	import type { NormalizedQuote, NormalizedRoute } from '$/api/lifi'
	import type { LiFiStep } from '@lifi/sdk'
	import type { ProviderDetailType } from '$/lib/wallet'
	import type { BridgeError } from '$/lib/errors'

	// Functions
	import { extractFeeBreakdown } from '$/api/lifi'
	import {
		calculateMinOutput,
		formatSlippagePercent,
	} from '$/constants/slippage'
	import { formatTokenAmount } from '$/lib/format'

	// Components
	import LoadingButton from '$/components/LoadingButton.svelte'
	import ErrorDisplay from './ErrorDisplay.svelte'
	import FeeBreakdown from './FeeBreakdown.svelte'

	// Props
	let {
		quote = null,
		quoteStep = null,
		route = null,
		slippage = 0.005,
		connectedDetail,
		execLoading = false,
		execError = null,
		execRetryAttempt = 1,
		execTxHashes = [],
		showSendButton = true,
		quoteExpired = false,
		onSendTransaction,
		onDismissExecError,
		onRetryExec,
	}: {
		quote?: NormalizedQuote | null
		quoteStep?: LiFiStep | null
		route?: NormalizedRoute | null
		slippage?: number
		connectedDetail: ProviderDetailType | null
		execLoading?: boolean
		execError?: BridgeError | null
		execRetryAttempt?: number
		execTxHashes?: string[]
		showSendButton?: boolean
		quoteExpired?: boolean
		onSendTransaction: () => void
		onDismissExecError?: () => void
		onRetryExec?: () => void
	} = $props()

	const estimatedToAmount = $derived(
		route?.toAmount ?? quote?.estimatedToAmount ?? '0',
	)
	const minOutput = $derived(
		calculateMinOutput(BigInt(estimatedToAmount), slippage),
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

<output data-column='gap-2' data-testid='quote-result' for='from-network to-network amount from-address'>
	<dl data-quote-summary>
		<dt>Estimated output</dt>
		<dd>{formatTokenAmount(estimatedToAmount, 6)} USDC (steps: {stepCount})</dd>
		<dt>Minimum (with {formatSlippagePercent(slippage)} slippage)</dt>
		<dd>{formatTokenAmount(minOutput.toString(), 6)} USDC</dd>
	</dl>
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
			{#if execLoading}
				<span id='send-loading-status' class='sr-only'>Sending transaction, please wait</span>
			{/if}
			<LoadingButton
				type='button'
				loading={execLoading}
				loadingText='Bridging…'
				disabled={quoteExpired}
				aria-describedby={execLoading ? 'send-loading-status' : undefined}
				onclick={onSendTransaction}
			>
				{#snippet children()}
					Send transaction
				{/snippet}
			</LoadingButton>
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
		<dl data-quote-summary>
			<dt>Tx</dt>
			<dd data-column='gap-1'>
				{#each execTxHashes as hash (hash)}
					<a data-link href={`https://etherscan.io/tx/${hash}`} target='_blank' rel='noopener noreferrer'>{hash.slice(0, 10)}…</a>
				{/each}
			</dd>
		</dl>
	{/if}
</output>

<style>
	[data-quote-summary] {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25em 1em;
	}

	[data-quote-summary] dt,
	[data-quote-summary] dd {
		margin: 0;
	}

	[data-quote-summary] dd[data-column] {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25em;
	}
</style>
