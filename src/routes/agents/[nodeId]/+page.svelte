<script lang="ts">


	// Types/constants
	import type { DialogueTree } from '$/data/DialogueTree'


	
	// Context
    import { page } from '$app/state'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { dialogueTreesCollection } from '$/collections/dialogue-trees'
	import { dialogueTurnsCollection } from '$/collections/dialogue-turns'


	// Props
	const nodeId = $derived(
		page.params.nodeId ?? ''
	)


	// (Derived)
	const treeByIdQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dialogueTreesCollection })
				.where(({ row }) => eq(row.id, nodeId))
				.select(({ row }) => ({ row })),
		[],
	)

	const turnByIdQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dialogueTurnsCollection })
				.where(({ row }) => eq(row.id, nodeId))
				.select(({ row }) => ({ row })),
		[],
	)

	const resolvedTreeId = $derived(
		treeByIdQuery.data?.[0]?.row.id
			?? turnByIdQuery.data?.[0]?.row.treeId
			?? null,
	)

	const treeQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dialogueTreesCollection })
				.where(({ row }) => eq(row.id, resolvedTreeId ?? ''))
				.select(({ row }) => ({ row })),
		[],
	)

	const turnsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dialogueTurnsCollection })
				.where(({ row }) => eq(row.treeId, resolvedTreeId ?? ''))
				.select(({ row }) => ({ row })),
		[],
	)

	const tree = $derived<DialogueTree | null>(
		treeQuery.data?.[0]?.row ?? null,
	)

	const turns = $derived(
		(turnsQuery.data ?? []).map((result) => result.row),
	)


	// Functions
	import { goto } from '$app/navigation'
	import { createDialogueTree, submitDialogueTurn } from '$/lib/dialogue'

	const handleFirstPrompt = async (value: string, entityRefs: import('$/data/EntityRef').EntityRef[]) => {
		const effectiveTree = tree ?? createDialogueTree({ id: nodeId })
		const turnId = await submitDialogueTurn({
			treeId: effectiveTree.id,
			parentId: null,
			userPrompt: value,
			entityRefs,
			systemPrompt: effectiveTree.systemPrompt,
		})
		goto(`/agents/${effectiveTree.id}#turn:${turnId}`, { replaceState: true })
	}


	// State
	let promptValue = $state('')


	// Components
	import DialogueTreeView from '$/components/agent/DialogueTreeView.svelte'
	import EntityRefInput from '$/components/EntityRefInput.svelte'
</script>


<main id="main" data-column="gap-4" data-sticky-container>
	{#if tree}
		{#if turns.length > 0}
			<DialogueTreeView
				{tree}
				{turns}
			/>
		{:else}
			<div data-column="gap-4">
				<h1>{tree.name ?? 'New conversation'}</h1>
				<p data-muted>Start the conversation by typing a prompt.</p>
				<EntityRefInput
					bind:value={promptValue}
					onsubmit={(value, entityRefs) => {
						handleFirstPrompt(value, entityRefs)
						promptValue = ''
					}}
					placeholder="Ask something…"
				/>
			</div>
		{/if}
	{:else}
		<div data-column="gap-4">
			<h1>New conversation</h1>
			<p data-muted>Start the conversation by typing a prompt.</p>
			<EntityRefInput
				bind:value={promptValue}
				onsubmit={(value, entityRefs) => {
					handleFirstPrompt(value, entityRefs)
					promptValue = ''
				}}
				placeholder="Ask something…"
			/>
		</div>
	{/if}
</main>
