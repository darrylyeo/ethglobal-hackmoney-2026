import type { AgentChatTree } from '$/data/AgentChatTree'
import type { AgentChatTurn } from '$/data/AgentChatTurn'
import type { EntityRef } from '$/data/EntityRef'
import type { LlmGenerateInput } from '$/lib/llm-provider'
import { DataSource } from '$/constants/data-sources'
import { agentChatTreesCollection } from '$/collections/agent-chat-trees'
import { agentChatTurnsCollection } from '$/collections/agent-chat-turns'
import { createLlmProvider } from '$/lib/llm-provider'

export const DEFAULT_SYSTEM_PROMPT =
	'You are a helpful assistant that answers questions about blockchain transactions, tokens, and protocols. Be concise and factual.'

export const AGENT_CHAT_PROMPT_VERSION = '2026-02-05'

const collectAncestors = (
	turns: AgentChatTurn[],
	turn: AgentChatTurn,
): AgentChatTurn[] => {
	const ancestors: AgentChatTurn[] = []
	let current: AgentChatTurn | undefined = turn
	while (current?.parentId) {
		current = turns.find((t) => t.id === current!.parentId)
		if (current) ancestors.unshift(current)
	}
	return ancestors
}

export const buildAgentChatMessages = (
	turns: AgentChatTurn[],
	turn: AgentChatTurn,
	systemPrompt: string,
): LlmGenerateInput => {
	const ancestors = collectAncestors(turns, turn)
	const contextLines = ancestors.flatMap((ancestor) => [
		`User: ${ancestor.userPrompt}`,
		...(
			ancestor.assistantText
				? [`Assistant: ${ancestor.assistantText}`]
				: []
		),
	])
	return {
		systemPrompt,
		userPrompt: [
			...contextLines,
			`User: ${turn.userPrompt}`,
		].join('\n\n'),
	}
}

export const submitAgentChatTurn = async (options: {
	treeId: string
	parentId: string | null
	userPrompt: string
	entityRefs: EntityRef[]
	systemPrompt: string
	connectionId?: string | null
	modelId?: string | null
	onProgress?: (progress: number) => void
}) => {
	const turnId = crypto.randomUUID()
	const now = Date.now()
	const connectionId = options.connectionId ?? undefined
	const modelId = options.modelId ?? undefined

	const turn: AgentChatTurn = {
		id: turnId,
		treeId: options.treeId,
		parentId: options.parentId,
		userPrompt: options.userPrompt,
		entityRefs: options.entityRefs,
		assistantText: null,
		providerId: null,
		providerConfig:
			connectionId != null || modelId != null
				? { connectionId: connectionId ?? undefined, modelId: modelId ?? undefined }
				: undefined,
		status: 'generating',
		createdAt: now,
		promptVersion: AGENT_CHAT_PROMPT_VERSION,
	}

	agentChatTurnsCollection.insert({
		...turn,
		$source: DataSource.Llm,
	})

	const allTurns = [...agentChatTurnsCollection.state.values()]
		.filter((row) => row.treeId === options.treeId)

	const messages = buildAgentChatMessages(allTurns, turn, options.systemPrompt)
	const tree = agentChatTreesCollection.state.get(options.treeId)
	const effectiveConnectionId =
		connectionId ?? tree?.defaultConnectionId ?? null
	const effectiveModelId = modelId ?? tree?.defaultModelId ?? null
	const provider = createLlmProvider({
		onProgress: options.onProgress,
		connectionId: effectiveConnectionId,
		modelId: effectiveModelId,
	})

	try {
		const output = await provider.generate(messages)
		agentChatTurnsCollection.update(turnId, (draft) => {
			draft.assistantText = output.text
			draft.providerId = output.providerId
			draft.status = 'complete'
		})
	} catch (error) {
		agentChatTurnsCollection.update(turnId, (draft) => {
			draft.status = 'error'
			draft.error = error instanceof Error ? error.message : String(error)
		})
	}

	agentChatTreesCollection.update(options.treeId, (draft) => {
		draft.updatedAt = Date.now()
	})

	return turnId
}

export const retryAgentChatTurn = async (options: {
	turnId: string
	allTurns: AgentChatTurn[]
	systemPrompt: string
	onProgress?: (progress: number) => void
}) => {
	const turn = options.allTurns.find((t) => t.id === options.turnId)
	if (!turn || turn.status !== 'error') return

	agentChatTurnsCollection.update(options.turnId, (draft) => {
		draft.status = 'generating'
		draft.error = undefined
	})

	const messages = buildAgentChatMessages(
		options.allTurns,
		turn,
		options.systemPrompt,
	)
	const tree = turn.treeId ? agentChatTreesCollection.state.get(turn.treeId) : null
	const effectiveConnectionId = turn.providerConfig?.connectionId ?? tree?.defaultConnectionId ?? null
	const effectiveModelId = turn.providerConfig?.modelId ?? tree?.defaultModelId ?? null
	const provider = createLlmProvider({
		onProgress: options.onProgress,
		connectionId: effectiveConnectionId,
		modelId: effectiveModelId,
	})

	try {
		const output = await provider.generate(messages)
		agentChatTurnsCollection.update(options.turnId, (draft) => {
			draft.assistantText = output.text
			draft.providerId = output.providerId
			draft.status = 'complete'
		})
	} catch (error) {
		agentChatTurnsCollection.update(options.turnId, (draft) => {
			draft.status = 'error'
			draft.error = error instanceof Error ? error.message : String(error)
		})
	}

	agentChatTreesCollection.update(turn.treeId, (draft) => {
		draft.updatedAt = Date.now()
	})
}

export const createAgentChatTree = (overrides?: Partial<AgentChatTree>) => {
	const id = crypto.randomUUID()
	const now = Date.now()

	const tree: AgentChatTree = {
		id,
		name: null,
		pinned: false,
		systemPrompt: DEFAULT_SYSTEM_PROMPT,
		createdAt: now,
		updatedAt: now,
		...overrides,
	}

	agentChatTreesCollection.insert({
		...tree,
		$source: DataSource.Llm,
	})

	return tree
}

export const collectAgentChatTurnDescendantIds = (
	turnId: string,
	allTurns: AgentChatTurn[],
): Set<string> => {
	const ids = new Set<string>([turnId])
	let frontier = [turnId]
	while (frontier.length > 0) {
		const next: string[] = []
		for (const id of frontier) {
			for (const t of allTurns)
				if (t.parentId === id && !ids.has(t.id)) {
					ids.add(t.id)
					next.push(t.id)
				}
		}
		frontier = next
	}
	return ids
}

export const deleteAgentChatTurn = (turnId: string, allTurns: AgentChatTurn[]) => {
	const ids = collectAgentChatTurnDescendantIds(turnId, allTurns)
	for (const id of ids)
		agentChatTurnsCollection.delete(id)
}

export const deleteAgentChatTree = (treeId: string) => {
	for (const [id, row] of agentChatTurnsCollection.state)
		if (row.treeId === treeId)
			agentChatTurnsCollection.delete(id)
	agentChatTreesCollection.delete(treeId)
}
