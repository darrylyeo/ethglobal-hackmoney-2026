import {
	intents,
	type IntentDefinition,
	type IntentMatchContext,
} from '$/constants/intents.ts'

export type { IntentDefinition }

export const findIntentDefinition = (ctx: IntentMatchContext) =>
	intents.find((def) => def.match(ctx)) ?? null

export const intentEntityTypes = new Set(
	intents.flatMap((def) => [...def.sourceTypes, ...def.targetTypes]),
)
