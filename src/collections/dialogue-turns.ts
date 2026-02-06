import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import { DataSource } from '$/constants/data-sources'
import type { DialogueTurn } from '$/data/DialogueTurn'

export type DialogueTurnRow = DialogueTurn & { $source: DataSource }

export const dialogueTurnsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'dialogue-turns',
		storageKey: 'dialogue-turns',
		getKey: (row: DialogueTurnRow) => row.id,
		parser: { stringify, parse },
	}),
)
