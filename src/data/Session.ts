import {
	ActionType,
	createAction,
	actionTypes,
	type Action,
} from '$/constants/actions.ts'
import type { TevmSimulationSummaryStatus } from '$/data/TevmSimulationResult.ts'

export const actions = actionTypes.map((d) => createAction(d.type)) as unknown as readonly Action[]

export enum SessionStatus {
	Draft = 'Draft',
	Submitted = 'Submitted',
	Finalized = 'Finalized',
}

export type SessionSimulationSummary = {
	forkMetadata: { blockNumber: number; rpcUrl: string; timestamp?: number }
	summaryStatus: TevmSimulationSummaryStatus
	gasTotals: { used: string; refund?: string },
}

export type Session = {
	id: string
	name?: string
	actions: Action[]
	status: SessionStatus
	createdAt: number
	updatedAt: number
	lockedAt?: number
	params: Record<string, unknown>
	latestSimulationId?: string
	simulationCount?: number
	simulation?: SessionSimulationSummary
	execution?: {
		submittedAt: number
		txHash?: `0x${string}`
		chainId?: number,
	}
	finalization?: {
		at: number
		receipt?: Record<string, unknown>,
	},
}

export enum SessionTemplateId {
	Swap = 'Swap',
	Bridge = 'Bridge',
	Transfer = 'Transfer',
	AddLiquidity = 'AddLiquidity',
}

export type SessionTemplate = { id?: SessionTemplateId } & Pick<Session, 'name' | 'actions'>

export const sessionTemplates = [
	{
		id: SessionTemplateId.Swap,
		name: 'Swap',
		actions: [
			createAction(ActionType.Swap),
		],
	},
	{
		id: SessionTemplateId.Bridge,
		name: 'Bridge',
		actions: [
			createAction(ActionType.Bridge),
		],
	},
	{
		id: SessionTemplateId.Transfer,
		name: 'Transfer',
		actions: [
			createAction(ActionType.Transfer),
		],
	},
	{
		id: SessionTemplateId.AddLiquidity,
		name: 'Add Liquidity',
		actions: [
			createAction(ActionType.AddLiquidity),
		],
	},
] as const satisfies readonly SessionTemplate[]

export const sessionTemplatesById = Object.fromEntries(
	sessionTemplates
		.map(template => [
			template.id,
			template
		])
)
