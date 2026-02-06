<script lang="ts">


	// Context
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { dialogueTreesCollection } from '$/collections/dialogue-trees'


	// Functions
	const togglePin = (treeId: string) => {
		dialogueTreesCollection.update(treeId, (draft) => {
			draft.pinned = !draft.pinned
			draft.updatedAt = Date.now()
		})
	}


	// (Derived)
	const treesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dialogueTreesCollection })
				.select(({ row }) => ({ row })),
		[],
	)

	const trees = $derived(
		(treesQuery.data ?? [])
			.map((result) => result.row)
			.sort((a, b) => b.updatedAt - a.updatedAt),
	)


	// Components
	import { Button } from 'bits-ui'
</script>


<main id="main" data-column="gap-4" data-sticky-container>
	<div data-row="gap-2 align-center justify-between">
		<h1>Agents</h1>
		<Button.Root href="/agents/new">
			New conversation
		</Button.Root>
	</div>

	{#if trees.length === 0}
		<p data-muted>No conversations yet.</p>
	{:else}
		{#each trees as tree (tree.id)}
			<div data-card data-row="gap-2 align-center justify-between">
				<a href="/agents/{tree.id}" data-row="gap-2 align-center" data-row-item="flexible">
					<div data-column="gap-1">
						<strong>{tree.name ?? 'Untitled'}</strong>
						<small data-muted>{new Date(tree.updatedAt).toLocaleString()}</small>
					</div>
					{#if tree.pinned}
						<span data-muted>Pinned</span>
					{/if}
				</a>
				<Button.Root
				onclick={(e: MouseEvent) => {
					e.preventDefault()
					e.stopPropagation()
					togglePin(tree.id)
				}}
				>
					{tree.pinned ? 'Unpin' : 'Pin'}
				</Button.Root>
			</div>
		{/each}
	{/if}
</main>
