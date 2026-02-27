<script lang="ts">
	// Types/constants
	import type { Sort } from '$/components/Sorts.svelte'
	import type { EvmTopic as EvmTopicRow } from '$/data/EvmTopic.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'
	import { evmTopicsCollection } from '$/collections/EvmTopics.ts'
	import { EvmSignatureSort } from '$/lib/evm-signature-sorts.ts'
	import { getEvmTopicPath } from '$/lib/signature-paths.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	// (Derived)
	const query = useLiveQuery((q) =>
		q.from({ row: evmTopicsCollection }).select(({ row }) => ({ row })),
	)
	const rows = $derived((query.data ?? []).map(({ row: topic }) => topic as EvmTopicRow))

	const sortOptions: Sort<EvmTopicRow, EvmSignatureSort>[] = [
		{ id: EvmSignatureSort.Hex, label: 'Hex', compare: (a, b) => a.$id.hex.localeCompare(b.$id.hex) },
		{
			id: EvmSignatureSort.FirstSig,
			label: 'First signature',
			compare: (a, b) =>
				(a.signatures[0] ?? '').localeCompare(b.signatures[0] ?? ''),
		},
	]

	// State (bound from RefinableList)
	let displayCount = $state(0)

	// (Derived)
	const getKey = (e: EvmTopicRow) => e.$id.hex

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import RefinableList from '$/components/RefinableList.svelte'
	import EvmTopic from '$/views/EvmTopic.svelte'
</script>

<svelte:head>
	<title>EVM topics</title>
</svelte:head>

<main data-column="gap-4">
	<Heading>EVM topics</Heading>
	<p>
		32-byte event topic hashes with resolved EVM event signatures from
		<a href="https://4byte.sourcify.dev/" target="_blank" rel="noopener noreferrer">4byte.sourcify.dev</a>
		and
		<a href="https://www.4byte.directory/docs/" target="_blank" rel="noopener noreferrer">4byte.directory</a>.
		<a href="/evm">EVM Signatures</a> · <a href="/calldata-decoder">Calldata decoder</a>.
	</p>

	{#if query.isLoading && rows.length === 0}
		<p>Loading…</p>
	{:else if query.isError}
		<p>Failed to load topics.</p>
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
				<p>No topics in cache. Use the <a href="/calldata-decoder">calldata decoder</a> to look one up.</p>
			{/snippet}
			{#snippet Item({ key: _k, item: entry, isPlaceholder })}
				{#if !isPlaceholder && entry != null}
					<EntityView
						entityType={EntityType.EvmTopic}
						entity={entry}
						titleHref={getEvmTopicPath(entry.$id.hex)}
						label={entry.signatures[0] ?? entry.$id.hex}
						layout={EntityLayout.PageSection}
						metadata={[{ term: 'Hex', detail: entry.$id.hex }]}
						annotation="topic"
					>
						{#snippet children()}
							<EvmTopic entry={entry} />
						{/snippet}
					</EntityView>
				{/if}
			{/snippet}
		</RefinableList>
	{/if}
</main>
