import {
	ActionType,
	IntentInvocationModality,
	Protocol,
	actionSpecs,
	protocolActions,
	intents,
	type Entity,
	type IntentDefinition,
	type IntentEntityRef,
	type IntentOption,
} from '$/constants/intents.ts'


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
			.filter(pa => pa.action === action)
			.map(pa => pa.protocol),
	]),
)

export const intentEntityTypes = new Set(
	intents.flatMap(def => def.entities.map(e => e.type)),
)


// Derived lookups from actionSpecs

export const specBySessionAction = Object.fromEntries(
	(Object.entries(actionSpecs) as [ActionType, typeof actionSpecs[ActionType]][])
		.map(([actionType, spec]) => [
			spec.sessionAction,
			{ ...spec, actionType },
		]),
) as Record<string, typeof actionSpecs[ActionType] & { actionType: ActionType }>

export const validSessionActions = new Set<string>([
	...Object.values(actionSpecs).map(s => s.sessionAction),
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
