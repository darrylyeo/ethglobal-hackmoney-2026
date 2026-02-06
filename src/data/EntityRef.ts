import type { EntityType } from '$/data/$EntityType'

export type EntityRef = {
	entityType: EntityType
	entityId: string
	displayLabel: string
	/** Trigger character for this reference (e.g. '@', '#'); used for display and parsing. */
	trigger?: string
}
