import type { EntityType } from '$/constants/entity-types'

export type IntentPlacement = 'from' | 'to'

export type IntentKind =
	| 'transfer'
	| 'swap'
	| 'bridge'
	| 'transfer+swap'
	| 'transfer+bridge'
	| 'swap+bridge'
	| 'transfer+swap+bridge'

export type IntentEntityRef = {
	type: EntityType
	id: Record<string, unknown>
}

export type IntentEntityContext = {
	placement?: IntentPlacement
	source?: string
}

export type IntentDragPayload = {
	entity: IntentEntityRef
	context?: IntentEntityContext
}

export type IntentDimensions = {
	actor: `0x${string}` | null
	chainId: number | null
	tokenAddress: `0x${string}` | null
}

export type IntentResolvedEntity = {
	ref: IntentEntityRef
	dimensions: IntentDimensions
}

export type IntentResolution = {
	status: 'valid' | 'invalid'
	kind?: IntentKind
	reason?: string
	from: IntentResolvedEntity
	to: IntentResolvedEntity
	equality: {
		actor: boolean | null
		chain: boolean | null
		token: boolean | null
	}
}
