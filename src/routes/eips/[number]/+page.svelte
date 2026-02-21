<script lang="ts">
	// Types/constants
	import { EntityType } from '$/data/$EntityType.ts'
	import { ProposalType, type ProposalEntry } from '$/data/ProposalEntry.ts'

	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { proposalsCollection } from '$/collections/Proposals.ts'

	// (Derived)
	const numberParam = $derived(page.params.number ?? '')
	const number = $derived(parseInt(numberParam, 10))
	const isValidNumber = $derived(Number.isInteger(number) && number >= 0)

	const entriesQuery = useLiveQuery((q) =>
		q
			.from({ row: proposalsCollection })
			.select(({ row }) => ({ row })),
	)
	const entry = $derived(
		isValidNumber
			? (entriesQuery.data ?? []).find(
				(r) => (r.row as ProposalEntry).number === number,
			)?.row as ProposalEntry | undefined
			: undefined,
	)

	const idSerialized = $derived(String(number))
	const label = $derived(
		entry
			? `${entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-${entry.number} ${entry.title}`
			: idSerialized,
	)
	const metadata = $derived(
		entry
			? [
					{ term: 'Status', detail: entry.status },
					{ term: 'Category', detail: entry.category },
					{ term: 'Type', detail: entry.type === ProposalType.Erc ? 'ERC' : 'EIP' },
				]
			: [],
	)

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Proposal from '$/views/Proposal.svelte'
</script>

<svelte:head>
	<title>
		{entry
			? `${entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-${entry.number}: ${entry.title}`
			: `EIP/ERC ${numberParam}`}
		– EIPs / ERCs
	</title>
</svelte:head>

<main>
	{#if !isValidNumber}
		<h1>Not found</h1>
		<p>Invalid EIP/ERC number: {numberParam || '(missing)'}</p>
	{:else if entriesQuery.isLoading && !entry}
		<p>Loading…</p>
	{:else if entriesQuery.isError && !entry}
		<p>
			Failed to load:
			{(proposalsCollection.utils.lastError as unknown as { message?: string })?.message ?? 'Unknown error'}
		</p>
	{:else if !entry}
		<h1>Not found</h1>
		<p>EIP/ERC-{number} not in index.</p>
		<p>
			<a href={resolve('/eips')}>Browse all EIPs / ERCs</a>
		</p>
	{:else}
		<section data-scroll-item>
			<EntityView
				entityType={EntityType.Proposal}
				entity={entry}
				entityId={{ id: idSerialized }}
				{idSerialized}
				href={resolve(`/eips/${numberParam}`)}
				{label}
				{metadata}
				annotation={entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}
			>
				{#snippet Title()}
					<strong>{entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-{entry.number}</strong>
					{entry.title}
				{/snippet}
				<Proposal {entry} />
			</EntityView>
		</section>
	{/if}
</main>
