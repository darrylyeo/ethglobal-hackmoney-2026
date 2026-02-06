import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import { DataSource } from '$/constants/data-sources'
import type { DialogueTree } from '$/data/DialogueTree'

export type DialogueTreeRow = DialogueTree & { $source: DataSource }

export const dialogueTreesCollection = createCollection(
	localStorageCollectionOptions({
		id: 'dialogue-trees',
		storageKey: 'dialogue-trees',
		getKey: (row: DialogueTreeRow) => row.id,
		parser: { stringify, parse },
	}),
)
