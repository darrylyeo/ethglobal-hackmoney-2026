/**
 * Canonical string key for an entity: EntityType:[stringify($id)].
 * Use for DOM id, href fragment, storage key, or any stable reference.
 */

import { EntityType, type EntityId } from '$/data/$EntityType.ts'
import { stringify } from 'devalue'

const keyFromId = (entityId: string | EntityId) =>
	typeof entityId === 'string' ? entityId : stringify(entityId)

export function entityKey(row: {
	entityType: EntityType
	entityId: string | EntityId
}): string
export function entityKey(entityType: EntityType, entity: { $id: EntityId }): string
export function entityKey(
	entityTypeOrRow: EntityType | { entityType: EntityType; entityId: string | EntityId },
	entity?: { $id: EntityId },
) {
	if (entity != null)
		return `${entityTypeOrRow as EntityType}:${keyFromId(entity.$id)}`
	const rec = entityTypeOrRow as { entityType: EntityType; entityId: string | EntityId }
	return `${rec.entityType}:${keyFromId(rec.entityId)}`
}
