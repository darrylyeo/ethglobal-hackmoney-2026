import { DataSource } from '$/constants/data-sources'
import type { AgentChatTree } from '$/data/AgentChatTree'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type AgentChatTreeRow = AgentChatTree & { $source: DataSource }

export const agentChatTreesCollection = createCollection(
	localStorageCollectionOptions({
		id: 'agent-chat-trees',
		storageKey: 'agent-chat-trees',
		getKey: (row: AgentChatTreeRow) => row.id,
		parser: { stringify, parse },
	}),
)
