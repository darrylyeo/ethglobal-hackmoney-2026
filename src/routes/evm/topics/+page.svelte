<script lang="ts">
	// Types/constants
	import type { Sort } from '$/components/Sorts.svelte'
	import type { EvmTopic } from '$/data/EvmTopic.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'
	import { evmTopicsCollection } from '$/collections/EvmTopics.ts'
	import { getEvmTopicPath } from '$/lib/signature-paths.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	// (Derived)
	const query = useLiveQuery((q) =>
		q.from({ row: evmTopicsCollection }).select(({ row }) => ({ row })),
	)
	const rows = $derived((query.data ?? []).map(({ row: topic }) => topic as EvmTopic))

	const sortOptions: Sort<EvmTopic, 'hex' | 'first-sig'>[] = [
		{ id: 'hex', label: 'Hex', compare: (a, b) => a.$id.hex.localeCompare(b.$id.hex) },
		{
			id: 'first-sig',
			label: 'First signature',
			compare: (a, b) =>
				(a.signatures[0] ?? '').localeCompare(b.signatures[0] ?? ''),
		},
	]

	// State
	let sortedItems = $state<EvmTopic[]>([])

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import Sorts from '$/components/Sorts.svelte'
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
		<Sorts
			items={rows}
			sortOptions={sortOptions}
			defaultSortId="hex"
			bind:sortedItems
		/>
		<p>{sortedItems.length} entries</p>
		<ul data-column="gap-4" role="list">
			{#each sortedItems as entry (entry.$id.hex)}
				<li>
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
							<EvmTopic {entry} />
						{/snippet}
					</EntityView>
				</li>
			{/each}
		</ul>
		{#if rows.length === 0}
			<p>No topics in cache. Use the <a href="/calldata-decoder">calldata decoder</a> to look one up.</p>
		{/if}
	{/if}
</main>
