/**
 * Sessions collection (transaction/session flow state).
 * Persists to localStorage across sessions.
 */

import { CollectionId } from '$/constants/collections.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import type { Session } from '$/data/Session.ts'

export const sessionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.Sessions,
		storageKey: CollectionId.Sessions,
		getKey: (session: Session) => session.$id.id,
		parser: { stringify, parse },
	}),
)
