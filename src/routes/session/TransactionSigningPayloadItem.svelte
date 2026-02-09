<script lang="ts">
	// Types/constants
	import type { TransactionSigningPayload } from '$/lib/session/resolveSigningPayloads.ts'
	import {
		describePayloadData,
		formatPayloadValue,
	} from '$/lib/session/payloadDisplay.ts'


	// Components
	import Address from '$/components/Address.svelte'
	import NetworkName from '$/views/NetworkName.svelte'


	// Props
	let {
		payload,
	}: {
		payload: TransactionSigningPayload
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

<article data-card data-signing-payload data-column="gap-2 padding-3">
	<div data-row="gap-2 align-center">
		{#if payload.label}
			<h4>{payload.label}</h4>
		{/if}
	</div>
	<dl>
		<dt>Network</dt>
		<dd>
			<NetworkName chainId={payload.chainId} showChainId={true} />
		</dd>
		<dt>From</dt>
		<dd>
			<Address
				network={payload.chainId}
				address={payload.from}
				showAvatar={false}
			/>
		</dd>
		{#if payload.to != null}
			<dt>To</dt>
			<dd>
				<Address
					network={payload.chainId}
					address={payload.to}
					showAvatar={false}
				/>
			</dd>
		{/if}
		<dt>Value</dt>
		<dd data-text="font-monospace">{valueFormatted}</dd>
		<dt>Data</dt>
		<dd data-text="font-monospace">{dataSummary}</dd>
		{#if payload.gasLimit != null && payload.gasLimit !== ''}
			<dt>Gas limit</dt>
			<dd data-text="font-monospace">{payload.gasLimit}</dd>
		{/if}
	</dl>
</article>

<style>
	[data-signing-payload] dl dd {
		word-break: break-all;
	}
</style>
