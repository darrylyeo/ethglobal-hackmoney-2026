import type { Action } from '$/constants/actions.ts'

export type SessionAction = {
	id: string
	sessionId: string
	indexInSequence: number
	action: Action
}
