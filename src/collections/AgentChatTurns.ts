import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { AgentChatTurn } from '$/data/AgentChatTurn.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type AgentChatTurnRow = AgentChatTurn & { $source: DataSource }

export const agentChatTurnsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.AgentChatTurns,
		storageKey: CollectionId.AgentChatTurns,
		getKey: (row: AgentChatTurnRow) => row.id,
		parser: { stringify, parse },
	}),
)
