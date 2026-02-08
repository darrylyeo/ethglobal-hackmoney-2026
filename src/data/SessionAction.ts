import type { Action } from '$/constants/actions.ts'

export type SessionAction = {
	id: string
	sessionId: string
	actionIndex: number
	action: Action
}
