import type { DialogueTree } from '$/data/DialogueTree'
import type { DialogueTurn } from '$/data/DialogueTurn'
import type { EntityRef } from '$/data/EntityRef'
import type { LlmGenerateInput } from '$/lib/explain'
import { DataSource } from '$/constants/data-sources'
import { dialogueTreesCollection } from '$/collections/dialogue-trees'
import { dialogueTurnsCollection } from '$/collections/dialogue-turns'
import { createLlmProvider } from '$/lib/explain'

export const DEFAULT_SYSTEM_PROMPT =
	'You are a helpful assistant that answers questions about blockchain transactions, tokens, and protocols. Be concise and factual.'

export const DIALOGUE_PROMPT_VERSION = '2026-02-05'

const collectAncestors = (
	turns: DialogueTurn[],
	turn: DialogueTurn,
): DialogueTurn[] => {
	const ancestors: DialogueTurn[] = []
	let current: DialogueTurn | undefined = turn
	while (current?.parentId) {
		current = turns.find((t) => t.id === current!.parentId)
		if (current) ancestors.unshift(current)
	}
	return ancestors
}

export const buildDialogueMessages = (
	turns: DialogueTurn[],
	turn: DialogueTurn,
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

export const submitDialogueTurn = async (options: {
	treeId: string
	parentId: string | null
	userPrompt: string
	entityRefs: EntityRef[]
	systemPrompt: string
	onProgress?: (progress: number) => void
}) => {
	const turnId = crypto.randomUUID()
	const now = Date.now()

	const turn: DialogueTurn = {
		id: turnId,
		treeId: options.treeId,
		parentId: options.parentId,
		userPrompt: options.userPrompt,
		entityRefs: options.entityRefs,
		assistantText: null,
		providerId: null,
		status: 'generating',
		createdAt: now,
		promptVersion: DIALOGUE_PROMPT_VERSION,
	}

	dialogueTurnsCollection.insert({
		...turn,
		$source: DataSource.Llm,
	})

	const allTurns = [...dialogueTurnsCollection.state.values()]
		.filter((row) => row.treeId === options.treeId)

	const messages = buildDialogueMessages(allTurns, turn, options.systemPrompt)
	const provider = createLlmProvider({ onProgress: options.onProgress })

	try {
		const output = await provider.generate(messages)
		dialogueTurnsCollection.update(turnId, (draft) => {
			draft.assistantText = output.text
			draft.providerId = output.providerId
			draft.status = 'complete'
		})
	} catch (error) {
		dialogueTurnsCollection.update(turnId, (draft) => {
			draft.status = 'error'
			draft.error = error instanceof Error ? error.message : String(error)
		})
	}

	dialogueTreesCollection.update(options.treeId, (draft) => {
		draft.updatedAt = Date.now()
	})

	return turnId
}

export const retryDialogueTurn = async (options: {
	turnId: string
	allTurns: DialogueTurn[]
	systemPrompt: string
	onProgress?: (progress: number) => void
}) => {
	const turn = options.allTurns.find((t) => t.id === options.turnId)
	if (!turn || turn.status !== 'error') return

	dialogueTurnsCollection.update(options.turnId, (draft) => {
		draft.status = 'generating'
		draft.error = undefined
	})

	const messages = buildDialogueMessages(
		options.allTurns,
		turn,
		options.systemPrompt,
	)
	const provider = createLlmProvider({ onProgress: options.onProgress })

	try {
		const output = await provider.generate(messages)
		dialogueTurnsCollection.update(options.turnId, (draft) => {
			draft.assistantText = output.text
			draft.providerId = output.providerId
			draft.status = 'complete'
		})
	} catch (error) {
		dialogueTurnsCollection.update(options.turnId, (draft) => {
			draft.status = 'error'
			draft.error = error instanceof Error ? error.message : String(error)
		})
	}

	dialogueTreesCollection.update(turn.treeId, (draft) => {
		draft.updatedAt = Date.now()
	})
}

export const createDialogueTree = (overrides?: Partial<DialogueTree>) => {
	const id = crypto.randomUUID()
	const now = Date.now()

	const tree: DialogueTree = {
		id,
		name: null,
		pinned: false,
		systemPrompt: DEFAULT_SYSTEM_PROMPT,
		createdAt: now,
		updatedAt: now,
		...overrides,
	}

	dialogueTreesCollection.insert({
		...tree,
		$source: DataSource.Llm,
	})

	return tree
}

export const collectDialogueTurnDescendantIds = (
	turnId: string,
	allTurns: DialogueTurn[],
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

export const deleteDialogueTurn = (turnId: string, allTurns: DialogueTurn[]) => {
	const ids = collectDialogueTurnDescendantIds(turnId, allTurns)
	for (const id of ids)
		dialogueTurnsCollection.delete(id)
}
