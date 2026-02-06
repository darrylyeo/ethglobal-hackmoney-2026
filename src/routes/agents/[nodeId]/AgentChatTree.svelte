<script lang="ts">


	// Types/constants
	import type { LlmConnectionRow } from '$/collections/llm-connections'
	import type { AgentChatTree } from '$/data/AgentChatTree'
	import type { AgentChatTurn } from '$/data/AgentChatTurn'


	// Props
	let {
		tree,
		turns,
		connections = [],
	}: {
		tree: AgentChatTree
		turns: AgentChatTurn[]
		connections?: readonly LlmConnectionRow[]
	} = $props()


	// (Derived)
	const rootTurn = $derived(
		turns.find((t) => t.parentId === null),
	)


	// Functions
	import { agentChatTreesCollection } from '$/collections/agent-chat-trees'

	const updateTreeName = (name: string) => {
		agentChatTreesCollection.update(tree.id, (draft) => {
			draft.name = name || null
			draft.updatedAt = Date.now()
		})
	}

	const treeModelValue = $derived(
		tree.defaultConnectionId && tree.defaultModelId
			? `${tree.defaultConnectionId}:${tree.defaultModelId}`
			: '',
	)
	const updateTreeModel = (v: string) => {
		const [connectionId, modelId] =
			v && v.includes(':') ? v.split(':').map((s) => s?.trim() ?? null) : [null, null]
		agentChatTreesCollection.update(tree.id, (draft) => {
			draft.defaultConnectionId = connectionId ?? undefined
			draft.defaultModelId = modelId ?? undefined
			draft.updatedAt = Date.now()
		})
	}

	const togglePin = () => {
		agentChatTreesCollection.update(tree.id, (draft) => {
			draft.pinned = !draft.pinned
			draft.updatedAt = Date.now()
		})
	}


	// Components
	import { Button } from 'bits-ui'
	import ModelInput from '$/components/ModelInput.svelte'
	import AgentChatTurnNode from './AgentChatTurnNode.svelte'
</script>


<div data-column="gap-4" id="agent-chat:{tree.id}">
	<div data-row="gap-2 align-center">
		<input
			type="text"
			bind:value={() => tree.name ?? '', updateTreeName}
			placeholder="Untitled conversation"
			data-row-item="flexible"
		/>
		<Button.Root href="/agents/new">
			New conversation
		</Button.Root>
		<Button.Root onclick={togglePin}>
			{tree.pinned ? 'Unpin' : 'Pin'}
		</Button.Root>
	</div>

	{#if connections.length > 0}
		<div data-row="gap-2 align-center">
			<label for="tree-model-{tree.id}">Default model</label>
			<ModelInput
				id="tree-model-{tree.id}"
				connections={connections}
				bind:value={() => treeModelValue, updateTreeModel}
				placeholder="Default model"
				ariaLabel="Default model"
			/>
		</div>
	{/if}

	<details>
		<summary>System prompt</summary>
		<pre data-card>{tree.systemPrompt}</pre>
	</details>

	{#if rootTurn}
		<AgentChatTurnNode
			turn={rootTurn}
			allTurns={turns}
			{tree}
			{connections}
		/>
	{:else}
		<p data-muted>No messages yet. Type a prompt below to start.</p>
	{/if}
</div>
