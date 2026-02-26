import { CollectionId } from '$/constants/collections.ts'
import type { AgentChatTurn } from '$/data/AgentChatTurn.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export const agentChatTurnsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.AgentChatTurns,
		storageKey: CollectionId.AgentChatTurns,
		getKey: (turn: AgentChatTurn) => turn.$id,
		parser: { stringify, parse },
	}),
)
