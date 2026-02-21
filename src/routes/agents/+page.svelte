<script lang="ts">
	// Types/constants
	import { agentChatTreesCollection } from '$/collections/AgentChatTrees.ts'
	import { APP_NAME } from '$/constants/app.ts'
	import { deleteAgentChatTree } from '$/lib/agentChat.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'


	// Context
	const treesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTreesCollection })
				.select(({ row }) => ({ row })),
		[],
	)


	// (Derived)
	const trees = $derived(
		(treesQuery.data ?? [])
			.map((result) => result.row)
			.sort((a, b) => b.updatedAt - a.updatedAt),
	)


	// Actions
	const togglePin = (treeId: string) => {
		agentChatTreesCollection.update(treeId, (draft) => {
			draft.pinned = !draft.pinned
			draft.updatedAt = Date.now()
		})
	}


	// Components
	import { Button } from 'bits-ui'
</script>


<svelte:head>
	<title>Agents – {APP_NAME}</title>
</svelte:head>


<main
	id="main"
	data-column="gap-4"
	data-sticky-container
>
	<header data-row="wrap gap-4">
		<div data-row="start gap-2" data-row-item="flexible">
			<h1>Agents</h1>
		</div>
		<div data-row="gap-2">
			<Button.Root href="/agents/registry">
				EIP-8004 registry
			</Button.Root>
			<Button.Root href="/agents/new">
				New conversation
			</Button.Root>
		</div>
	</header>

	{#if trees.length === 0}
		<p data-text="muted">No conversations yet.</p>
	{:else}
		{#each trees as tree (tree.id)}
			<div
				data-card
				data-row="gap-2 align-center justify-between"
			>
				<a
					href="/agents/{tree.id}"
					data-row="gap-2 align-center"
					data-row-item="flexible"
				>
					<div data-column="gap-2">
						<strong>{tree.name ?? 'Untitled'}</strong>
						<small data-text="muted">{new Date(tree.updatedAt).toLocaleString()}</small>
					</div>
					{#if tree.pinned}
						<span data-text="muted">Pinned</span>
					{/if}
				</a>
				<span data-row="gap-2">
					<Button.Root
						onclick={(e: MouseEvent) => {
							e.preventDefault()
							e.stopPropagation()
							togglePin(tree.id)
						}}
					>
						{tree.pinned ? 'Unpin' : 'Pin'}
					</Button.Root>
					<Button.Root
						onclick={(e: MouseEvent) => {
							e.preventDefault()
							e.stopPropagation()
							deleteAgentChatTree(tree.id)
						}}
					>
						Delete
					</Button.Root>
				</span>
			</div>
		{/each}
	{/if}
</main>
