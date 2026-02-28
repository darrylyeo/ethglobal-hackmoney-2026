<script lang="ts">
	// Types/constants
	import type { Sort } from '$/components/Sorts.svelte'
	import type { EvmSelector as EvmSelectorRow } from '$/data/EvmSelector.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'
	import { evmSelectorsCollection } from '$/collections/EvmSelectors.ts'
	import { EvmSignatureSort } from '$/lib/evm-signature-sorts.ts'
	import { getEvmSelectorPath } from '$/lib/signature-paths.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	// (Derived)
	const query = useLiveQuery((q) =>
		q.from({ row: evmSelectorsCollection }).select(({ row }) => ({ row })),
	)
	const rows = $derived(
		(query.data ?? []).map(({ row: selector }) => selector as EvmSelectorRow)
	)

	const sortOptions: Sort<EvmSelectorRow, EvmSignatureSort>[] = [
		{ id: EvmSignatureSort.Hex, label: 'Hex', compare: (a, b) => a.$id.hex.localeCompare(b.$id.hex) },
		{
			id: EvmSignatureSort.FirstSig,
			label: 'First signature',
			compare: (a, b) =>
				(a.signatures[0] ?? '').localeCompare(b.signatures[0] ?? ''),
		},
	]


	// State (bound from RefinableList)
	let displayCount = $state(
		0
	)

	// (Derived)
	const getKey = (e: EvmSelectorRow) => e.$id.hex


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import RefinableList from '$/components/RefinableList.svelte'
	import SearchableText from '$/components/SearchableText.svelte'
	import EvmSelector from '$/views/EvmSelector.svelte'
</script>


<svelte:head>
	<title>EVM selectors</title>
</svelte:head>


<main data-column="gap-4">
	<Heading>EVM selectors</Heading>
	<p>
		4-byte function selectors with resolved EVM function signatures from
		<a href="https://4byte.sourcify.dev/" target="_blank" rel="noopener noreferrer">4byte.sourcify.dev</a>
		and
		<a href="https://www.4byte.directory/docs/" target="_blank" rel="noopener noreferrer">4byte.directory</a>.
		<a href="/evm">EVM Signatures</a> · <a href="/calldata-decoder">Calldata decoder</a>.
	</p>

	{#if query.isLoading && rows.length === 0}
		<p>Loading…</p>
	{:else if query.isError}
		<p>Failed to load selectors.</p>
	{:else}
		<p>{displayCount} entries</p>
		<RefinableList
			items={rows}
			filterGroups={[]}
			defaultFilterIds={new Set<string>()}
			{sortOptions}
			defaultSortId={EvmSignatureSort.Hex}
			{getKey}
			bind:displayCount
			placeholderKeys={new Set<string>()}
			data-column="gap-4"
			role="list"
		>
			{#snippet Empty()}
				<p>No selectors in cache. Use the <a href="/calldata-decoder">calldata decoder</a> to look one up.</p>
			{/snippet}

			{#snippet Item({ key: _k, item: entry, isPlaceholder, searchQuery: q, matches })}
				{#if !isPlaceholder && entry != null}
					{@const label = entry.signatures[0] ?? entry.$id.hex}
					<EntityView
						entityType={EntityType.EvmSelector}
						entity={entry}
						titleHref={getEvmSelectorPath(entry.$id.hex)}
						{label}
						layout={EntityLayout.PageSection}
						metadata={[{ term: 'Hex', detail: entry.$id.hex }]}
						annotation="selector"
					>
						{#snippet Title()}
							{#if q != null && q !== ''}
								<SearchableText text={label} query={q} {matches} />
							{:else}
								{label}
							{/if}
						{/snippet}

						{#snippet children()}
							<EvmSelector entry={entry} />
						{/snippet}
					</EntityView>
				{/if}
			{/snippet}
		</RefinableList>
	{/if}
</main>
