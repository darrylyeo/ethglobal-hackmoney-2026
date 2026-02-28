<script lang="ts">
	// Types/constants
	import type { TransactionSigningPayload } from '$/lib/session/resolveSigningPayloads.ts'


	// Props
	let {
		payloads,
	}: {
		payloads: readonly TransactionSigningPayload[]
	} = $props()

	// (Derived)
	const items = $derived(
		new Set(payloads)
	)


	// Components
	import List from '$/components/List.svelte'
	import SignaturePayload from './SignaturePayload.svelte'
</script>


<div
	class="proposed-tx-list"
	data-column="gap-2"
>
	<div
		class="proposed-tx-scroll"
		data-scroll-container="block"
	>
		<List
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
					<SignaturePayload payload={item} />
				{/if}
			{/snippet}

			{#snippet Empty()}
				<p data-text="muted">
					No transactions for this action.
				</p>
			{/snippet}
		</List>
	</div>
</div>


<style>
	.proposed-tx-list {
		display: flex;
		flex-direction: column;
		flex: 1 1 0%;
		min-block-size: 0;
	}

	.proposed-tx-scroll {
		flex: 1 1 0%;
		min-block-size: 0;
	}
</style>
