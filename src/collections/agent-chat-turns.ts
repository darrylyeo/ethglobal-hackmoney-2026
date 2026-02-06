import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import { DataSource } from '$/constants/data-sources'
import type { AgentChatTurn } from '$/data/AgentChatTurn'

export type AgentChatTurnRow = AgentChatTurn & { $source: DataSource }

export const agentChatTurnsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'agent-chat-turns',
		storageKey: 'agent-chat-turns',
		getKey: (row: AgentChatTurnRow) => row.id,
		parser: { stringify, parse },
	}),
)
