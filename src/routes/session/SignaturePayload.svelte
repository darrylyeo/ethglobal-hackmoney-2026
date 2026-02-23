<script lang="ts">
	// Types/constants
	import type { TransactionSigningPayload } from '$/lib/session/resolveSigningPayloads.ts'
	import { formatPayloadValue } from '$/lib/session/payloadDisplay.ts'


	// Props
	let {
		payload,
	}: {
		payload: TransactionSigningPayload
	} = $props()


	// (Derived)
	const valueFormatted = $derived(formatPayloadValue(payload.value))


	// Components
	import Calldata from './Calldata.svelte'
	import Address from '$/views/Address.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
</script>

<article data-card data-signature-payload data-column="gap-2 padding-3">
	<header data-row="align-center">
		{#if payload.label}
			<h4>{payload.label}</h4>
		{/if}
	</header>
	<dl>
		<dt>Network</dt>
		<dd>
			<NetworkName networkId={{ chainId: payload.chainId }} showChainId={true} />
		</dd>
		<dt>From</dt>
		<dd>
			<Address
				actorId={{ $network: { chainId: payload.chainId }, address: payload.from }}
				showAvatar={false}
			/>
		</dd>
		{#if payload.to != null}
			<dt>To</dt>
			<dd>
				<Address
					actorId={{ $network: { chainId: payload.chainId }, address: payload.to }}
					showAvatar={false}
				/>
			</dd>
		{/if}
		<dt>Value</dt>
		<dd data-text="font-monospace">{valueFormatted}</dd>
		<dt>Data</dt>
		<dd>
			<Calldata data={payload.data} />
		</dd>
		{#if payload.gasLimit != null && payload.gasLimit !== ''}
			<dt>Gas limit</dt>
			<dd data-text="font-monospace">{payload.gasLimit}</dd>
		{/if}
	</dl>
</article>

<style>
	[data-signature-payload] dl dd {
		word-break: break-all;
	}
</style>
