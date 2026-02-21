import { goto } from '$app/navigation'

import {
	watchedEntitiesCollection,
	watchEntity,
	unwatchEntity,
} from '$/collections/WatchedEntities.ts'
import { EntityType } from '$/data/$EntityType.ts'
import type { EntityId } from '$/data/$EntityType.ts'
import { deriveWatchedEntityRow } from '$/routes/navigationItems.svelte.ts'
import type { WatchedEntityStoredRow } from '$/collections/WatchedEntities.ts'

import type {
	navigateSchema,
	watchEntitySchema,
	unwatchEntitySchema,
} from '$/lib/webmcp/schemas.ts'

type NavigateInput = (typeof navigateSchema) extends { properties: infer P }
	? { [K in keyof P]?: unknown }
	: never
type EntityRefInput = (typeof watchEntitySchema) extends { properties: infer P }
	? { [K in keyof P]: unknown }
	: never

export const executeNavigate = async (input: NavigateInput) => {
	const path = (input.path as string) ?? '/'
	const replace = (input.replace as boolean) ?? false
	await goto(path, { replaceState: replace })
	return { path }
}

export const executeListWatchedEntities = async () => {
	const stored = [...watchedEntitiesCollection.state.values()].filter(
		(r): r is WatchedEntityStoredRow => r != null && 'entityType' in r && 'entityId' in r,
	)
	const derived = stored.map((r) => deriveWatchedEntityRow(r))
	return derived.map((r) => ({ id: r.id, label: r.label, href: r.href, entityType: r.entityType }))
}

export const executeWatchEntity = async (input: EntityRefInput) => {
	const entityType = input.entityType as EntityType
	const entityId = input.entityId as string | EntityId
	watchEntity({ entityType, entityId: entityId as EntityId })
	return { entityType, entityId, watched: true }
}

export const executeUnwatchEntity = async (input: EntityRefInput) => {
	const entityType = input.entityType as EntityType
	const entityId = input.entityId as EntityId
	unwatchEntity(entityType, entityId)
	return { entityType, entityId, watched: false }
}

export const executeGetCurrentRoute = async () => ({
	pathname: typeof location !== 'undefined' ? location.pathname : '',
	search: typeof location !== 'undefined' ? location.search : '',
	hash: typeof location !== 'undefined' ? location.hash : '',
})
