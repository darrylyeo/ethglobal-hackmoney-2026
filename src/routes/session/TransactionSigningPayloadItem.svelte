<script lang="ts">
	// Types/constants
	import type { TransactionSigningPayload } from '$/lib/session/resolveSigningPayloads.ts'


	// Props
	let {
		payload,
		chainName = '',
	}: {
		payload: TransactionSigningPayload
		chainName?: string
	} = $props()


	// (Derived)
	const toShort = $derived(
		payload.to
			? `${payload.to.slice(0, 6)}…${payload.to.slice(-4)}`
			: '—',
	)
	const valueDisplay = $derived(
		payload.value === '0' || !payload.value
			? '0'
			: payload.value.length <= 12
				? payload.value
				: `${payload.value.slice(0, 6)}…`,
	)
	const dataLabel = $derived(
		!payload.data || payload.data === '0x' ? 'No data' : `Calldata ${payload.data.length} chars`,
	)
</script>

<article data-card data-column="gap-1 padding-2" data-signing-payload>
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
	<dl data-row="gap-2 wrap" class="payload-meta">
		<div data-column="gap-0">
			<dt data-text="annotation">To</dt>
			<dd>{toShort}</dd>
		</div>
		<div data-column="gap-0">
			<dt data-text="annotation">Value</dt>
			<dd>{valueDisplay}</dd>
		</div>
		<div data-column="gap-0">
			<dt data-text="annotation">Data</dt>
			<dd>{dataLabel}</dd>
		</div>
	</dl>
</article>

<style>
	.payload-meta {
		font-size: 0.9em;
	}
	.payload-meta dt {
		opacity: 0.8;
	}
</style>
