import { DataSource } from '$/constants/data-sources'
import {
	type LlmConnection,
	LlmConnectionProvider,
} from '$/data/LlmConnection'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type LlmConnectionRow = LlmConnection & { $source: DataSource }

export const llmConnectionsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'llm-connections',
		storageKey: 'llm-connections',
		getKey: (row: LlmConnectionRow) => row.id,
		parser: { stringify, parse },
	}),
)

export const addLlmConnection = (connection: Omit<LlmConnection, 'id' | 'createdAt' | 'updatedAt'>) => {
	const id = crypto.randomUUID()
	const now = Date.now()
	llmConnectionsCollection.insert({
		...connection,
		id,
		createdAt: now,
		updatedAt: now,
		$source: DataSource.Local,
	})
	return id
}

export const removeLlmConnection = (id: string) => {
	llmConnectionsCollection.delete(id)
}

export const updateLlmConnection = (
	id: string,
	updates: Partial<Pick<LlmConnection, 'label' | 'apiKey' | 'defaultModelId' | 'endpoint'>>,
) => {
	const existing = llmConnectionsCollection.state.get(id)
	if (!existing) return
	llmConnectionsCollection.update(id, (draft) => {
		Object.assign(draft, updates, { updatedAt: Date.now() })
	})
}

export const PROVIDER_LABELS: Record<string, string> = {
	[LlmConnectionProvider.OpenAI]: 'OpenAI',
	[LlmConnectionProvider.Anthropic]: 'Anthropic',
	[LlmConnectionProvider.Google]: 'Google',
	[LlmConnectionProvider.Zen]: 'OpenCode Zen',
	[LlmConnectionProvider.Hosted]: 'Hosted',
}
