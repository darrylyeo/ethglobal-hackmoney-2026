<script lang="ts">
	// Types/constants
	import type { TransactionSigningPayload } from '$/lib/session/resolveSigningPayloads.ts'
	import type { Network } from '$/constants/networks.ts'

	import TransactionSigningPayloadItem from './TransactionSigningPayloadItem.svelte'


	// Props
	let {
		payloads,
		networksByChainId = {},
	}: {
		payloads: readonly TransactionSigningPayload[]
		networksByChainId?: Partial<Record<number, Network>>
	} = $props()


	// (Derived)
	const chainName = (chainId: number) =>
		networksByChainId[chainId]?.name ?? `Chain ${chainId}`
</script>

{#if payloads.length === 0}
	<p data-muted>No transactions for this action.</p>
{:else}
	<ol data-column="gap-2" class="signing-payload-list">
		{#each payloads as payload (payload.stepIndex)}
			<li>
				<TransactionSigningPayloadItem
					{payload}
					chainName={chainName(payload.chainId)}
				/>
			</li>
		{/each}
	</ol>
{/if}

<style>
	.signing-payload-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
</style>
