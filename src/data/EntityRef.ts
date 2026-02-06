import type { EntityType } from '$/data/$EntityType'

export type EntityRef = {
	entityType: EntityType
	entityId: string
	displayLabel: string
}
