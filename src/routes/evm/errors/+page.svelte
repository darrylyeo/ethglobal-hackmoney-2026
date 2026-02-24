<script lang="ts">
	// Types/constants
	import type { Sort } from '$/components/Sorts.svelte'
	import type { EvmError } from '$/data/EvmError.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'
	import { evmErrorsCollection } from '$/collections/EvmErrors.ts'
	import { getEvmErrorPath } from '$/lib/signature-paths.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	// (Derived)
	const query = useLiveQuery((q) =>
		q.from({ row: evmErrorsCollection }).select(({ row }) => ({ row })),
	)
	const rows = $derived((query.data ?? []).map((r) => r.row as EvmError))

	const sortOptions: Sort<EvmError, 'hex' | 'first-sig'>[] = [
		{ id: 'hex', label: 'Hex', compare: (a, b) => a.$id.hex.localeCompare(b.$id.hex) },
		{
			id: 'first-sig',
			label: 'First signature',
			compare: (a, b) =>
				(a.signatures[0] ?? '').localeCompare(b.signatures[0] ?? ''),
		},
	]

	// State
	let sortedItems = $state<EvmError[]>([])

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import Sorts from '$/components/Sorts.svelte'
	import EvmError from '$/views/EvmError.svelte'
</script>

<svelte:head>
	<title>EVM errors</title>
</svelte:head>

<main data-column="gap-4">
	<Heading>EVM errors</Heading>
	<p>
		4-byte error selectors with resolved EVM error signatures from
		<a href="https://4byte.sourcify.dev/" target="_blank" rel="noopener noreferrer">4byte.sourcify.dev</a>
		and
		<a href="https://www.4byte.directory/docs/" target="_blank" rel="noopener noreferrer">4byte.directory</a>.
		<a href="/evm">EVM Signatures</a> · <a href="/calldata-decoder">Calldata decoder</a>.
	</p>

	{#if query.isLoading && rows.length === 0}
		<p>Loading…</p>
	{:else if query.isError}
		<p>Failed to load errors.</p>
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
						entityType={EntityType.EvmError}
						entity={entry}
						entityId={{ hex: entry.$id.hex }}
						idSerialized={entry.$id.hex}
						href={getEvmErrorPath(entry.$id.hex)}
						label={entry.signatures[0] ?? entry.$id.hex}
						layout={EntityLayout.PageSection}
						metadata={[{ term: 'Hex', detail: entry.$id.hex }]}
						annotation="error"
					>
						{#snippet children()}
							<EvmError {entry} />
						{/snippet}
					</EntityView>
				</li>
			{/each}
		</ul>
		{#if rows.length === 0}
			<p>No error selectors in cache. Open an error selector detail by hex to look one up.</p>
		{/if}
	{/if}
</main>
