import { EntityType } from '$/data/$EntityType.ts'

export enum IntentPlacement {
	From = 'from',
	To = 'to',
}

export enum IntentKind {
	Share = 'share',
	Transfer = 'transfer',
	Swap = 'swap',
	Bridge = 'bridge',
	TransferSwap = 'transfer+swap',
	TransferBridge = 'transfer+bridge',
	SwapBridge = 'swap+bridge',
	TransferSwapBridge = 'transfer+swap+bridge',
}

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
	interopAddress?: string
	tokenInteropAddress?: string
}

export type IntentResolvedEntity = {
	ref: IntentEntityRef
	dimensions: IntentDimensions
}

export type IntentEquality = {
	actor: boolean | null
	chain: boolean | null
	token: boolean | null
}

export type IntentResolution = {
	status: 'valid' | 'invalid'
	kind?: IntentKind
	reason?: string
	from: IntentResolvedEntity
	to: IntentResolvedEntity
	equality: IntentEquality
}

export type IntentMatchContext = {
	from: IntentResolvedEntity
	to: IntentResolvedEntity
	equality: IntentEquality
}

export enum RouteStepKey {
	SwapSource = 'swapSource',
	SwapDest = 'swapDest',
	Bridge = 'bridge',
	TransferFromToken = 'transferFromToken',
	TransferToTokenOnSource = 'transferToTokenOnSource',
	TransferToTokenOnDest = 'transferToTokenOnDest',
	TransferFromTokenOnDest = 'transferFromTokenOnDest',
}

export type IntentDefinition = {
	kind: IntentKind
	label: string
	match: (ctx: IntentMatchContext) => boolean
	sequences: RouteStepKey[][]
	sourceTypes: EntityType[]
	targetTypes: EntityType[]
}

export const intents: IntentDefinition[] = [
	{
		kind: IntentKind.Share,
		label: 'Share',
		match: ({ from, to }: IntentMatchContext) => (
			from.ref.type === EntityType.Actor
			&& to.ref.type === EntityType.RoomPeer
			&& !!from.dimensions.actor
		),
		sequences: [],
		sourceTypes: [EntityType.Actor],
		targetTypes: [EntityType.RoomPeer],
	},
	{
		kind: IntentKind.Transfer,
		label: 'Transfer',
		match: ({ equality: { actor, chain, token } }: IntentMatchContext) => (
			actor === false && chain === true && token === true
		),
		sequences: [[RouteStepKey.TransferFromToken]],
		sourceTypes: [EntityType.ActorCoin],
		targetTypes: [EntityType.ActorCoin, EntityType.Actor],
	},
	{
		kind: IntentKind.Swap,
		label: 'Swap',
		match: ({ equality: { actor, chain, token } }: IntentMatchContext) => (
			actor === true && chain === true && token === false
		),
		sequences: [[RouteStepKey.SwapSource]],
		sourceTypes: [EntityType.ActorCoin, EntityType.Coin, EntityType.TokenListCoin],
		targetTypes: [EntityType.ActorCoin, EntityType.Coin, EntityType.TokenListCoin],
	},
	{
		kind: IntentKind.Bridge,
		label: 'Bridge',
		match: ({ equality: { actor, chain, token } }: IntentMatchContext) => (
			actor === true && chain === false && token === true
		),
		sequences: [[RouteStepKey.Bridge]],
		sourceTypes: [EntityType.ActorCoin],
		targetTypes: [EntityType.ActorCoin],
	},
	{
		kind: IntentKind.TransferSwap,
		label: 'Transfer + Swap',
		match: ({ equality: { actor, chain, token } }: IntentMatchContext) => (
			actor === false && chain === true && token === false
		),
		sequences: [
			[RouteStepKey.SwapSource, RouteStepKey.TransferToTokenOnSource],
			[RouteStepKey.TransferFromToken, RouteStepKey.SwapDest],
		],
		sourceTypes: [EntityType.ActorCoin],
		targetTypes: [EntityType.ActorCoin],
	},
	{
		kind: IntentKind.SwapBridge,
		label: 'Swap + Bridge',
		match: ({ equality: { actor, chain, token } }: IntentMatchContext) => (
			actor === true && chain === false && token === false
		),
		sequences: [
			[RouteStepKey.SwapSource, RouteStepKey.Bridge],
			[RouteStepKey.Bridge, RouteStepKey.SwapDest],
		],
		sourceTypes: [EntityType.ActorCoin],
		targetTypes: [EntityType.ActorCoin],
	},
	{
		kind: IntentKind.TransferBridge,
		label: 'Transfer + Bridge',
		match: ({ equality: { actor, chain, token } }: IntentMatchContext) => (
			actor === false && chain === false && token === true
		),
		sequences: [
			[RouteStepKey.Bridge, RouteStepKey.TransferToTokenOnDest],
		],
		sourceTypes: [EntityType.ActorCoin],
		targetTypes: [EntityType.ActorCoin],
	},
	{
		kind: IntentKind.TransferSwapBridge,
		label: 'Transfer + Swap + Bridge',
		match: ({ equality: { actor, chain, token } }: IntentMatchContext) => (
			actor === false && chain === false && token === false
		),
		sequences: [
			[RouteStepKey.SwapSource, RouteStepKey.Bridge, RouteStepKey.TransferToTokenOnDest],
			[RouteStepKey.Bridge, RouteStepKey.SwapDest, RouteStepKey.TransferToTokenOnDest],
			[RouteStepKey.Bridge, RouteStepKey.TransferFromTokenOnDest, RouteStepKey.SwapDest],
		],
		sourceTypes: [EntityType.ActorCoin],
		targetTypes: [EntityType.ActorCoin],
	},
]
