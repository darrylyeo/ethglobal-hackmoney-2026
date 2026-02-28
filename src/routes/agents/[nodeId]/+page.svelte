<script lang="ts">
	// Types/constants
	import type { AgentChatTree as AgentChatTreeData } from '$/data/AgentChatTree.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { entityKey } from '$/lib/entity-key.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { DataSourceId } from '$/constants/data-sources.ts'
	import { ZEN_DEFAULT_CONNECTION_ID } from '$/constants/opencode-zen.ts'
	import { PUBLIC_OPENCODE_API_KEY } from '$env/static/public'
	import { agentChatTreesCollection } from '$/collections/AgentChatTrees.ts'
	import { agentChatTurnsCollection } from '$/collections/AgentChatTurns.ts'
	import { llmConnectionsCollection } from '$/collections/LlmConnections.ts'


	// Props
	const nodeId = $derived(
		page.params.nodeId ?? ''
	)

	// (Derived)
	const treeByIdQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTreesCollection })
				.where(({ row }) => eq(row.$id.id, nodeId))
				.select(({ row }) => ({ row })),
		[],
	)

	const turnByIdQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTurnsCollection })
				.where(({ row }) => eq(row.$id, nodeId))
				.select(({ row }) => ({ row })),
		[],
	)

	const resolvedTreeId = $derived(
		treeByIdQuery.data?.[0]?.row?.$id.id ?? turnByIdQuery.data?.[0]?.row?.treeId ?? null
	)

	const treeQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTreesCollection })
				.where(({ row }) => eq(row.$id.id, resolvedTreeId ?? ''))
				.select(({ row }) => ({ row })),
		[() => resolvedTreeId],
	)

	const turnsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTurnsCollection })
				.where(({ row }) => eq(row.treeId, resolvedTreeId ?? ''))
				.select(({ row }) => ({ row })),
		[() => resolvedTreeId],
	)

	const tree = $derived(
		(treeQuery.data?.[0]?.row as AgentChatTreeData | undefined) ?? null
	)

	const turns = $derived(
		(turnsQuery.data ?? []).map(({ row: turn }) => turn)
	)

	const llmConnectionsQuery = useLiveQuery((q) =>
		q
			.from({ row: llmConnectionsCollection })
			.select(({ row }) => ({ row })),
	)
	const llmConnectionsRaw = $derived(
		(llmConnectionsQuery.data ?? []).map(({ row: connection }) => connection).filter(Boolean)
	)
	const hasZenConnection = $derived(
		llmConnectionsRaw.some((c) => c.provider === 'zen')
	)
	const llmConnections = $derived(
		hasZenConnection ?
			llmConnectionsRaw
		:
			[
					...llmConnectionsRaw,
					...(typeof PUBLIC_OPENCODE_API_KEY === 'string' && PUBLIC_OPENCODE_API_KEY.length > 0 ?
						[
								{
									id: ZEN_DEFAULT_CONNECTION_ID,
									provider: 'zen' as const,
									label: 'OpenCode Zen',
									createdAt: 0,
									updatedAt: 0,
									$source: DataSourceId.Local,
								},
							]
						:
							[]),
				]
	)


	// Functions
	import { goto } from '$app/navigation'
	import { createAgentChatTree, submitAgentChatTurn } from '$/lib/agentChat.ts'

	const onFirstPrompt = async (value: string, entityRefs: import('$/data/EntityRef.ts').EntityRef[]) => {
		const effectiveTree = tree ?? createAgentChatTree({ $id: { id: nodeId } })
		const [connectionId, modelId] = parseModelValue(modelValue)
		const turnId = await submitAgentChatTurn({
			treeId: effectiveTree.$id.id,
			parentId: null,
			userPrompt: value,
			entityRefs,
			systemPrompt: effectiveTree.systemPrompt,
			connectionId: connectionId ?? effectiveTree.defaultConnectionId ?? null,
			modelId: modelId ?? effectiveTree.defaultModelId ?? null,
			requestUserInteraction,
			toolsForChat: toolsForChat ?? undefined,
		})
		goto(
			`/agents/${effectiveTree.$id.id}#${entityKey({
				entityType: EntityType.AgentChatTurn,
				entityId: turnId,
			})}`,
			{ replaceState: true },
		)
	}


	// State
	let promptValue = $state(
		''
	)
	let modelValue = $state(
		''
	)
	let requestUserInteraction: ((callback: () => Promise<unknown>) => Promise<unknown>) | undefined = undefined
	let toolsForChat: string[] | null = null

	function parseModelValue(v: string): [string | null, string | null] {
		if (!v || !v.includes(':')) return [null, null]
		const [a, b] = v.split(':')
		return [a?.trim() ?? null, b?.trim() ?? null]
	}


	// Components
	import ModelInput from '$/components/ModelInput.svelte'
	import AgentChatTree from './AgentChatTree.svelte'
	import EntityRefInput from '$/components/EntityRefInput.svelte'
	import EntityView from '$/components/EntityView.svelte'
</script>


<main
	data-column="gap-4"
	data-sticky-container
>
	{#if tree}
		{#if turns.length > 0}
			<AgentChatTree
				{tree}
				{turns}
				connections={llmConnections}
				{requestUserInteraction}
				{toolsForChat}
			/>
		{:else}
			<EntityView
				entityType={EntityType.AgentChatTree}
				entity={tree}
				titleHref={resolve(`/agents/${tree.$id.id}`)}
				label={tree.name ?? 'New conversation'}
				annotation="Conversation"
			>
				<p data-text="muted">
					Start the conversation by typing a prompt.
				</p>
				<div data-row="align-center">
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
						onFirstPrompt(value, entityRefs)
						promptValue = ''
					}}
					placeholder="Ask something…"
				/>
			</EntityView>
		{/if}
	{:else}
		<EntityView
			entityType={EntityType.AgentChatTree}
			idSerialized={nodeId}
			titleHref={resolve(`/agents/${nodeId}`)}
			label="New conversation"
			annotation="Conversation"
		>
			<p data-text="muted">
				Start the conversation by typing a prompt.
			</p>
			<div data-row="align-center">
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
					onFirstPrompt(value, entityRefs)
					promptValue = ''
				}}
				placeholder="Ask something…"
			/>
		</EntityView>
	{/if}
</main>
