import { CollectionId } from '$/constants/collections.ts'
import type { AgentChatTree } from '$/data/AgentChatTree.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export const agentChatTreesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.AgentChatTrees,
		storageKey: CollectionId.AgentChatTrees,
		getKey: (tree: AgentChatTree) => tree.$id.id,
		parser: { stringify, parse },
	}),
)
