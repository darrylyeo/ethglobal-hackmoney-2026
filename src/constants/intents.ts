import { EntityType } from '$/data/$EntityType.ts'


// Drag payload types (used by drag infrastructure)

export enum IntentPlacement {
	From = 'from',
	To = 'to',
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


// Intent invocation

export enum IntentInvocationModality {
	DragAndDrop = 'DragAndDrop',
}

export type IntentInvocationDefinition<_IntentEntityName extends string = string> = {
	modality: IntentInvocationModality
	entities: {
		dragTarget: _IntentEntityName
		dropTarget: _IntentEntityName
	}
}


// Intent entities

// TODO: map per EntityType when entity schemas are formalized
export type Entity = Record<string, unknown>

export type IntentEntity<
	_IntentEntityName extends string = string,
	_EntityType extends EntityType = EntityType,
> = {
	name: _IntentEntityName
	type: _EntityType
	match?: (entityId: Record<string, unknown>) => (
		| { result: true; reason: string }
		| { result: false; error: string }
	)
}


// Actions and protocols

export enum ActionType {
	Swap = 'Swap',
	Bridge = 'Bridge',
	Transfer = 'Transfer',
	CreateChannel = 'CreateChannel',
	AddChannelMember = 'AddChannelMember',
	CloseChannel = 'CloseChannel',
	AddLiquidity = 'AddLiquidity',
	RemoveLiquidity = 'RemoveLiquidity',
	CollectFees = 'CollectFees',
	IncreaseLiquidity = 'IncreaseLiquidity',
	ShareAddress = 'ShareAddress',
	ProposeTransfer = 'ProposeTransfer',
	RequestVerification = 'RequestVerification',
	DepositToCustody = 'DepositToCustody',
	WithdrawFromCustody = 'WithdrawFromCustody',
	ResizeChannel = 'ResizeChannel',
	CreatePool = 'CreatePool',
	AcceptTransfer = 'AcceptTransfer',
	RejectTransfer = 'RejectTransfer',
}

export enum Protocol {
	UniswapV4 = 'UniswapV4',
	LiFi = 'LiFi',
	Yellow = 'Yellow',
	Cctp = 'Cctp',
	PartyKit = 'PartyKit',
	Gateway = 'Gateway',
}

export type ProtocolAction<
	_ActionType extends ActionType = ActionType,
	_Protocol extends Protocol = Protocol,
> = {
	action: _ActionType
	protocol: _Protocol
}

export type ProtocolActionPayload<
	_ProtocolAction extends ProtocolAction = ProtocolAction,
> = {
	protocolAction: _ProtocolAction
	payload: {
		[ActionType.Swap]: {
			fromActorCoin: Record<string, unknown>
			toActorCoin: Record<string, unknown>
		}
		[ActionType.Bridge]: {
			fromActorCoin: Record<string, unknown>
			toActorCoin: Record<string, unknown>
		}
		[ActionType.Transfer]: {
			fromActorCoin: Record<string, unknown>
			toActorCoin: Record<string, unknown>
		}
		[ActionType.CreateChannel]: {
			actor: Record<string, unknown>
		}
		[ActionType.AddChannelMember]: {
			actor: Record<string, unknown>
		}
		[ActionType.CloseChannel]: {
			channel: Record<string, unknown>
			actor: Record<string, unknown>
		}
		[ActionType.AddLiquidity]: {
			actorCoin: Record<string, unknown>
			pool: Record<string, unknown>
		}
		[ActionType.RemoveLiquidity]: {
			position: Record<string, unknown>
			actor: Record<string, unknown>
		}
		[ActionType.CollectFees]: {
			position: Record<string, unknown>
			actor: Record<string, unknown>
		}
		[ActionType.IncreaseLiquidity]: {
			actorCoin: Record<string, unknown>
			position: Record<string, unknown>
		}
		[ActionType.ShareAddress]: {
			actor: Record<string, unknown>
			room: Record<string, unknown>
		}
		[ActionType.ProposeTransfer]: {
			fromActorCoin: Record<string, unknown>
			toPeer: Record<string, unknown>
		}
		[ActionType.RequestVerification]: {
			actor: Record<string, unknown>
			peer: Record<string, unknown>
		}
		[ActionType.DepositToCustody]: {
			actorCoin: Record<string, unknown>
		}
		[ActionType.WithdrawFromCustody]: {
			actorCoin: Record<string, unknown>
		}
		[ActionType.ResizeChannel]: {
			channel: Record<string, unknown>
			actorCoin: Record<string, unknown>
		}
		[ActionType.CreatePool]: {
			token0: Record<string, unknown>
			token1: Record<string, unknown>
		}
		[ActionType.AcceptTransfer]: {
			transferRequest: Record<string, unknown>
		}
		[ActionType.RejectTransfer]: {
			transferRequest: Record<string, unknown>
		}
	}[_ProtocolAction['action']]
}

export type IntentOption = {
	label: string
	actions: ProtocolActionPayload[]
}


// Intent definitions

export enum IntentType {
	SwapAndBridge = 'SwapAndBridge',
	CreateChannelAndAddMember = 'CreateChannelAndAddMember',
	CreateChannelAddMemberAndTransfer = 'CreateChannelAddMemberAndTransfer',
	AddLiquidity = 'AddLiquidity',
	RemoveLiquidity = 'RemoveLiquidity',
}

export type IntentDefinition<
	_IntentEntityName extends string = string,
> = {
	type: IntentType
	label: string
	invocations: IntentInvocationDefinition<_IntentEntityName>[]
	entities: IntentEntity<_IntentEntityName>[]
	resolveOptions?: (entities: Record<_IntentEntityName, Entity>) => IntentOption[]
}

export const protocolActions = [
	{ action: ActionType.Swap, protocol: Protocol.UniswapV4 },
	{ action: ActionType.Swap, protocol: Protocol.LiFi },
	{ action: ActionType.Bridge, protocol: Protocol.Cctp },
	{ action: ActionType.Bridge, protocol: Protocol.LiFi },
	{ action: ActionType.Bridge, protocol: Protocol.Gateway },
	{ action: ActionType.Transfer, protocol: Protocol.Yellow },
	{ action: ActionType.Transfer, protocol: Protocol.LiFi },
	{ action: ActionType.CreateChannel, protocol: Protocol.Yellow },
	{ action: ActionType.AddChannelMember, protocol: Protocol.Yellow },
	{ action: ActionType.CloseChannel, protocol: Protocol.Yellow },
	{ action: ActionType.AddLiquidity, protocol: Protocol.UniswapV4 },
	{ action: ActionType.RemoveLiquidity, protocol: Protocol.UniswapV4 },
	{ action: ActionType.CollectFees, protocol: Protocol.UniswapV4 },
	{ action: ActionType.IncreaseLiquidity, protocol: Protocol.UniswapV4 },
	{ action: ActionType.ShareAddress, protocol: Protocol.PartyKit },
	{ action: ActionType.ProposeTransfer, protocol: Protocol.PartyKit },
	{ action: ActionType.RequestVerification, protocol: Protocol.PartyKit },
	{ action: ActionType.DepositToCustody, protocol: Protocol.Yellow },
	{ action: ActionType.WithdrawFromCustody, protocol: Protocol.Yellow },
	{ action: ActionType.ResizeChannel, protocol: Protocol.Yellow },
	{ action: ActionType.CreatePool, protocol: Protocol.UniswapV4 },
	{ action: ActionType.AcceptTransfer, protocol: Protocol.PartyKit },
	{ action: ActionType.RejectTransfer, protocol: Protocol.PartyKit },
] as const satisfies ProtocolAction[]

export const intents: IntentDefinition[] = [
	{
		type: IntentType.SwapAndBridge,
		label: 'Swap + Bridge',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'fromActorCoin',
					dropTarget: 'toActorNetwork',
				},
			},
		],

		entities: [
			{ name: 'fromActorCoin', type: EntityType.ActorCoin },
			{ name: 'toActorNetwork', type: EntityType.ActorNetwork },
		],

		resolveOptions: ({ fromActorCoin, toActorNetwork }) => [
			{
				label: 'Swap + Bridge via LiFi',
				actions: [
					{
						protocolAction: { action: ActionType.Swap, protocol: Protocol.LiFi },
						payload: { fromActorCoin, toActorCoin: toActorNetwork },
					},
					{
						protocolAction: { action: ActionType.Bridge, protocol: Protocol.LiFi },
						payload: { fromActorCoin, toActorCoin: toActorNetwork },
					},
				],
			},
			{
				label: 'Swap via Uniswap V4 + Bridge via CCTP',
				actions: [
					{
						protocolAction: { action: ActionType.Swap, protocol: Protocol.UniswapV4 },
						payload: { fromActorCoin, toActorCoin: toActorNetwork },
					},
					{
						protocolAction: { action: ActionType.Bridge, protocol: Protocol.Cctp },
						payload: { fromActorCoin, toActorCoin: toActorNetwork },
					},
				],
			},
		],
	},

	{
		type: IntentType.CreateChannelAndAddMember,
		label: 'Create Channel',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'fromActor',
					dropTarget: 'toActor',
				},
			},
		],

		entities: [
			{ name: 'fromActor', type: EntityType.Actor },
			{ name: 'toActor', type: EntityType.Actor },
		],

		resolveOptions: ({ fromActor, toActor }) => [
			{
				label: 'Create Yellow channel + Add member',
				actions: [
					{
						protocolAction: { action: ActionType.CreateChannel, protocol: Protocol.Yellow },
						payload: { actor: fromActor },
					},
					{
						protocolAction: { action: ActionType.AddChannelMember, protocol: Protocol.Yellow },
						payload: { actor: toActor },
					},
				],
			},
		],
	},

	{
		type: IntentType.CreateChannelAddMemberAndTransfer,
		label: 'Create Channel + Transfer',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'fromActorCoin',
					dropTarget: 'toActor',
				},
			},
		],

		entities: [
			{ name: 'fromActorCoin', type: EntityType.ActorCoin },
			{ name: 'toActor', type: EntityType.Actor },
		],

		resolveOptions: ({ fromActorCoin, toActor }) => [
			{
				label: 'Create Yellow channel + Add member + Transfer',
				actions: [
					{
						protocolAction: { action: ActionType.CreateChannel, protocol: Protocol.Yellow },
						payload: { actor: fromActorCoin },
					},
					{
						protocolAction: { action: ActionType.AddChannelMember, protocol: Protocol.Yellow },
						payload: { actor: toActor },
					},
					{
						protocolAction: { action: ActionType.Transfer, protocol: Protocol.Yellow },
						payload: { fromActorCoin, toActorCoin: toActor },
					},
				],
			},
		],
	},

	{
		type: IntentType.AddLiquidity,
		label: 'Add Liquidity',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'actorCoin',
					dropTarget: 'pool',
				},
			},
		],

		entities: [
			{ name: 'actorCoin', type: EntityType.ActorCoin },
			{ name: 'pool', type: EntityType.UniswapPool },
		],

		resolveOptions: ({ actorCoin, pool }) => [
			{
				label: 'Add liquidity via Uniswap V4',
				actions: [
					{
						protocolAction: { action: ActionType.AddLiquidity, protocol: Protocol.UniswapV4 },
						payload: { actorCoin, pool },
					},
				],
			},
		],
	},

	{
		type: IntentType.RemoveLiquidity,
		label: 'Remove Liquidity',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'position',
					dropTarget: 'actor',
				},
			},
		],

		entities: [
			{ name: 'position', type: EntityType.UniswapPosition },
			{ name: 'actor', type: EntityType.Actor },
		],

		resolveOptions: ({ position, actor }) => [
			{
				label: 'Remove liquidity via Uniswap V4',
				actions: [
					{
						protocolAction: { action: ActionType.RemoveLiquidity, protocol: Protocol.UniswapV4 },
						payload: { position, actor },
					},
				],
			},
		],
	},
]
