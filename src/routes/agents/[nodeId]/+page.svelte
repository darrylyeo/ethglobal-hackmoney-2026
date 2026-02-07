<script lang="ts">


	// Types/constants
	import type { AgentChatTree } from '$/data/AgentChatTree.ts'


	
	// Context
	import { page } from '$app/state'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { DataSource } from '$/constants/data-sources.ts'
	import { agentChatTreesCollection } from '$/collections/agent-chat-trees.ts'
	import { agentChatTurnsCollection } from '$/collections/agent-chat-turns.ts'
	import { llmConnectionsCollection } from '$/collections/llm-connections.ts'


	// Props
	const nodeId = $derived(
		page.params.nodeId ?? ''
	)


	// (Derived)
	const treeByIdQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTreesCollection })
				.where(({ row }) => eq(row.id, nodeId))
				.select(({ row }) => ({ row })),
		[],
	)

	const turnByIdQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTurnsCollection })
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
				.from({ row: agentChatTreesCollection })
				.where(({ row }) => eq(row.id, resolvedTreeId ?? ''))
				.select(({ row }) => ({ row })),
		[],
	)

	const turnsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTurnsCollection })
				.where(({ row }) => eq(row.treeId, resolvedTreeId ?? ''))
				.select(({ row }) => ({ row })),
		[],
	)

	const tree = $derived<AgentChatTree | null>(
		treeQuery.data?.[0]?.row ?? null,
	)

	const turns = $derived(
		(turnsQuery.data ?? []).map((result) => result.row),
	)

	const llmConnectionsQuery = useLiveQuery((q) =>
		q
			.from({ row: llmConnectionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)
	const llmConnections = $derived(
		(llmConnectionsQuery.data ?? []).map((r) => r.row),
	)


	// Functions
	import { goto } from '$app/navigation'
	import { createAgentChatTree, submitAgentChatTurn } from '$/lib/agentChat.ts'

	const handleFirstPrompt = async (value: string, entityRefs: import('$/data/EntityRef.ts').EntityRef[]) => {
		const effectiveTree = tree ?? createAgentChatTree({ id: nodeId })
		const [connectionId, modelId] = parseModelValue(modelValue)
		const turnId = await submitAgentChatTurn({
			treeId: effectiveTree.id,
			parentId: null,
			userPrompt: value,
			entityRefs,
			systemPrompt: effectiveTree.systemPrompt,
			connectionId: connectionId ?? effectiveTree.defaultConnectionId ?? null,
			modelId: modelId ?? effectiveTree.defaultModelId ?? null,
		})
		goto(`/agents/${effectiveTree.id}#turn:${turnId}`, { replaceState: true })
	}


	// State
	let promptValue = $state('')
	let modelValue = $state('')

	function parseModelValue(v: string): [string | null, string | null] {
		if (!v || !v.includes(':')) return [null, null]
		const [a, b] = v.split(':')
		return [a?.trim() ?? null, b?.trim() ?? null]
	}


	// Components
	import ModelInput from '$/components/ModelInput.svelte'
	import AgentChatTree from './AgentChatTree.svelte'
	import EntityRefInput from '$/components/EntityRefInput.svelte'
</script>


<main
	id="main"
	data-column="gap-4"
	data-sticky-container
>
	{#if tree}
		{#if turns.length > 0}
			<AgentChatTree
				{tree}
				{turns}
				connections={llmConnections}
			/>
		{:else}
			<div data-column="gap-4">
				<h1>{tree.name ?? 'New conversation'}</h1>
				<p data-muted>Start the conversation by typing a prompt.</p>
				<div data-row="gap-2 align-center">
					<ModelInput
						connections={llmConnections}
						bind:value={modelValue}
						placeholder="Model (optional)"
						ariaLabel="Model"
					/>
				</div>
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
			<div data-row="gap-2 align-center">
				<ModelInput
					connections={llmConnections}
					bind:value={modelValue}
					placeholder="Model (optional)"
					ariaLabel="Model"
				/>
			</div>
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
