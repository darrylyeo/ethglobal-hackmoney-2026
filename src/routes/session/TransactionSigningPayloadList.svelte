<script lang="ts">
	// Types/constants
	import type { TransactionSigningPayload } from '$/lib/session/resolveSigningPayloads.ts'

	import ItemsList from '$/components/ItemsList.svelte'
	import TransactionSigningPayloadItem from './TransactionSigningPayloadItem.svelte'


	// Props
	let {
		payloads,
	}: {
		payloads: readonly TransactionSigningPayload[]
	} = $props()


	// (Derived)
	const items = $derived(new Set(payloads))
</script>

{#if payloads.length === 0}
	<p data-text="muted">No transactions for this action.</p>
{:else}
	<ItemsList
		items={items}
		getKey={(payload) => payload.stepIndex}
		getSortValue={(payload) => payload.stepIndex}
		placeholderKeys={new Set()}
		data-list="unstyled gap-2"
	>
		{#snippet Item({ key, item, isPlaceholder })}
			{#if isPlaceholder}
				<div data-placeholder>…</div>
			{:else if item}
				<TransactionSigningPayloadItem payload={item} />
			{/if}
		{/snippet}
	</ItemsList>
{/if}
