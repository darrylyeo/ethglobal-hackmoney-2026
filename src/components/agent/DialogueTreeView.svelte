<script lang="ts">


	// Types/constants
	import type { DialogueTree } from '$/data/DialogueTree'
	import type { DialogueTurn } from '$/data/DialogueTurn'


	// Props
	let {
		tree,
		turns,
	}: {
		tree: DialogueTree
		turns: DialogueTurn[]
	} = $props()


	// (Derived)
	const rootTurn = $derived(
		turns.find((t) => t.parentId === null),
	)


	// Functions
	import { dialogueTreesCollection } from '$/collections/dialogue-trees'

	const updateTreeName = (name: string) => {
		dialogueTreesCollection.update(tree.id, (draft) => {
			draft.name = name || null
			draft.updatedAt = Date.now()
		})
	}

	const togglePin = () => {
		dialogueTreesCollection.update(tree.id, (draft) => {
			draft.pinned = !draft.pinned
			draft.updatedAt = Date.now()
		})
	}


	// Components
	import { Button } from 'bits-ui'
	import DialogueTurnNode from '$/components/agent/DialogueTurnNode.svelte'
</script>


<div data-column="gap-4" id="dialogue:{tree.id}">
	<div data-row="gap-2 align-center">
		<input
			type="text"
			value={tree.name ?? ''}
			placeholder="Untitled conversation"
			onchange={(e) => updateTreeName(e.currentTarget.value)}
			data-row-item="flexible"
		/>
		<Button.Root href="/agents/new">
			New conversation
		</Button.Root>
		<Button.Root onclick={togglePin}>
			{tree.pinned ? 'Unpin' : 'Pin'}
		</Button.Root>
	</div>

	<details>
		<summary>System prompt</summary>
		<pre data-card>{tree.systemPrompt}</pre>
	</details>

	{#if rootTurn}
		<DialogueTurnNode
			turn={rootTurn}
			allTurns={turns}
			{tree}
		/>
	{:else}
		<p data-muted>No messages yet. Type a prompt below to start.</p>
	{/if}
</div>
