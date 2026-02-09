<script lang="ts">
	// Types/constants
	import type { TransactionSigningPayload } from '$/lib/session/resolveSigningPayloads.ts'
	import {
		describePayloadData,
		formatPayloadValue,
	} from '$/lib/session/payloadDisplay.ts'


	// Props
	let {
		payload,
		chainName = '',
	}: {
		payload: TransactionSigningPayload
		chainName?: string
	} = $props()


	// (Derived)
	const dataDesc = $derived(describePayloadData(payload))
	const valueFormatted = $derived(formatPayloadValue(payload.value))
	const dataSummary = $derived(
		dataDesc.kind === 'empty'
			? '—'
			: dataDesc.kind === 'erc20_transfer'
				? `transfer(${dataDesc.to.slice(0, 10)}…, ${dataDesc.amount})`
				: dataDesc.kind === 'erc20_approve'
					? `approve(${dataDesc.spender.slice(0, 10)}…, ${dataDesc.amount === 2n ** 256n - 1n ? 'unlimited' : dataDesc.amount})`
					: `raw (${dataDesc.byteLength} bytes)`,
	)
</script>

<article data-card data-column="gap-2 padding-2" data-signing-payload>
	<div data-row="gap-2 align-center">
		<span data-text="annotation">{payload.stepIndex + 1}.</span>
		{#if payload.label}
			<strong>{payload.label}</strong>
		{/if}
	</div>
	{#if chainName}
		<p data-muted>{chainName} (Chain ID {payload.chainId})</p>
	{:else}
		<p data-muted>Chain ID {payload.chainId}</p>
	{/if}
	<dl class="payload-fields" data-column="gap-2">
		<div data-column="gap-0">
			<dt data-text="annotation">From</dt>
			<dd><code class="payload-address" title={payload.from}>{payload.from}</code></dd>
		</div>
		{#if payload.to != null}
			<div data-column="gap-0">
				<dt data-text="annotation">To</dt>
				<dd><code class="payload-address" title={payload.to}>{payload.to}</code></dd>
			</div>
		{/if}
		<div data-column="gap-0">
			<dt data-text="annotation">Value</dt>
			<dd><code>{valueFormatted}</code></dd>
		</div>
		<div data-column="gap-0">
			<dt data-text="annotation">Data</dt>
			<dd><code class="payload-data-desc">{dataSummary}</code></dd>
		</div>
		{#if payload.gasLimit != null && payload.gasLimit !== ''}
			<div data-column="gap-0">
				<dt data-text="annotation">Gas limit</dt>
				<dd><code>{payload.gasLimit}</code></dd>
			</div>
		{/if}
	</dl>
</article>

<style>
	.payload-fields {
		font-size: 0.9em;
	}
	.payload-fields dt {
		opacity: 0.8;
	}
	.payload-address,
	.payload-data-desc {
		word-break: break-all;
		font-size: 0.95em;
	}
</style>
