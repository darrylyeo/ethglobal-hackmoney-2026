import type { Entity } from '$/data/$EntityType.ts'
import type { Action } from '$/data/Session.ts'
import {
	ActionType,
	IntentInvocationModality,
	Protocol,
	actionTypes,
	protocolActions,
	intents,
	type ActionTypeDefinition,
	type IntentDefinition,
	type IntentEntityRef,
	type IntentOption,
} from '$/constants/intents.ts'

export { ActionType }

// Derived lookups from protocolActions

export const actionsByProtocol = Object.fromEntries(
	Object.values(Protocol).map(protocol => [
		protocol,
		protocolActions
			.filter(pa => pa.protocol === protocol)
			.map(pa => pa.action),
	]),
)

export const protocolsByAction = Object.fromEntries(
	Object.values(ActionType).map(action => [
		action,
		protocolActions
			.filter(pa => pa.id.actionType === action)
			.map(pa => pa.id.protocol),
	]),
)

export const intentEntityTypes = new Set(
	intents.flatMap(def => def.entities.map(e => e.type)),
)


// Derived lookups from actionTypes

export const specByActionType = Object.fromEntries(
	actionTypes.map((spec) => [spec.type, spec]),
) as Record<ActionType, ActionTypeDefinition>

export const specForAction = (action: Action['type']) =>
	action in ActionType ? specByActionType[action as ActionType] ?? null : null

export const validActionTypes = new Set<Action['type']>([
	...Object.values(ActionType),
	'liquidity',
	'intent',
])

export type IntentDragResolution =
	| {
		matched: true
		intent: IntentDefinition
		options: IntentOption[]
		error?: undefined
	}
	| {
		matched: true
		intent: IntentDefinition
		options: []
		error: unknown
	}
	| {
		matched: false
	}

export const resolveIntentForDrag = (
	source: IntentEntityRef,
	target: IntentEntityRef,
): IntentDragResolution => {
	for (const intent of intents) {
		for (const invocation of intent.invocations) {
			if (invocation.modality !== IntentInvocationModality.DragAndDrop) continue

			const dragEntity = intent.entities.find(e => e.name === invocation.entities.dragTarget)
			const dropEntity = intent.entities.find(e => e.name === invocation.entities.dropTarget)

			if (!dragEntity || !dropEntity) continue
			if (source.type !== dragEntity.type || target.type !== dropEntity.type) continue

			if (dragEntity.match) {
				const result = dragEntity.match(source.id)
				if (!result.result) continue
			}
			if (dropEntity.match) {
				const result = dropEntity.match(target.id)
				if (!result.result) continue
			}

			const entities: Record<string, Entity> = {
				[invocation.entities.dragTarget]: source.id,
				[invocation.entities.dropTarget]: target.id,
			}

			try {
				return {
					matched: true,
					intent,
					options: intent.resolveOptions?.(entities) ?? [],
				}
			} catch (error) {
				return { matched: true, intent, options: [], error }
			}
		}
	}
	return { matched: false }
}
