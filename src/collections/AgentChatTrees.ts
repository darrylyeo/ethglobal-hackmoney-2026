import { DataSource } from '$/constants/data-sources.ts'
import type { AgentChatTree } from '$/data/AgentChatTree.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type AgentChatTreeRow = AgentChatTree & { $source: DataSource }

export const agentChatTreesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.AgentChatTrees,
		storageKey: CollectionId.AgentChatTrees,
		getKey: (row: AgentChatTreeRow) => row.id,
		parser: { stringify, parse },
	}),
)
