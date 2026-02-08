import { CollectionId } from '$/constants/collections.ts'
import type { SessionAction } from '$/data/SessionAction.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type SessionActionRow = SessionAction

export const sessionActionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.SessionActions,
		storageKey: CollectionId.SessionActions,
		getKey: (row: SessionActionRow) => row.id,
		parser: { stringify, parse },
	}),
)
