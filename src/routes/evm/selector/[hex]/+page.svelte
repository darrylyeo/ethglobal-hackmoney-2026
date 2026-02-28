<script lang="ts">
	// Types/constants
	import type { EvmSelector } from '$/data/EvmSelector.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'
	import {
		ensureEvmFunctionSignatures,
		evmSelectorsCollection,
	} from '$/collections/EvmSelectors.ts'
	import { getEvmSelectorPath, parseEvmSelectorHex } from '$/lib/signature-paths.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'

	// Context
	import { page } from '$app/state'

	// (Derived)
	const hexParam = $derived(
		page.params?.hex ?? ''
	)
	const parsed = $derived(
		parseEvmSelectorHex(hexParam)
	)
	const href = $derived(
		parsed ? getEvmSelectorPath(parsed) : '/evm/selectors'
	)

	const entryQuery = useLiveQuery(
		(q) =>
			parsed
				? q
					.from({ row: evmSelectorsCollection })
					.where(({ row }) => eq(row.$id.hex, parsed))
					.select(({ row }) => ({ row }))
				: q
					.from({ row: evmSelectorsCollection })
					.where(({ row }) => eq(row.$id.hex, '0x' as `0x${string}`))
					.select(({ row }) => ({ row })),
		[() => parsed],
	)
	const entry = $derived(
		entryQuery.data?.[0]?.row as EvmSelector | undefined
	)
	const label = $derived(
		entry?.signatures[0] ?? (parsed ?? '')
	)

	// Actions
	$effect(() => {
		if (!parsed) return
		void ensureEvmFunctionSignatures(parsed).catch(() => {})
	})

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import EvmSelector from '$/views/EvmSelector.svelte'
</script>


<svelte:head>
	<title>{parsed ?? 'Selector'} — EVM selectors</title>
</svelte:head>

{#if !parsed}
	<main data-card>
		<Heading>Invalid selector</Heading>
		<p>
			Hex must be 4 bytes. <a href="/evm/selectors">
				Back to EVM selectors
			</a>.
		</p>
	</main>
{:else}
	<main data-card>
		<EntityView
			entityType={EntityType.EvmSelector}
			entity={entry}
			entityId={{ hex: parsed }}
			titleHref={href}
			{label}
			layout={EntityLayout.Page}
			metadata={[{ term: 'Hex', detail: parsed }]}
			annotation="selector"
		>
			{#snippet children()}
				{#if entry}
					<EvmSelector {entry} />
				{:else if entryQuery.isLoading}
					<p>
						Loading signatures…
					</p>
				{:else}
					<p>
						No signatures found for this selector.
					</p>
				{/if}
			{/snippet}
		</EntityView>
	</main>
{/if}
