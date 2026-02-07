import { EntityType, type Entity } from '$/data/$EntityType.ts'


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


// Actions

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

export enum ActionCategory {
	ValueTransfer = 'value-transfer',
	Liquidity = 'liquidity',
	Channel = 'channel',
	Custody = 'custody',
	Room = 'room',
}

export type ActionTypeDefinition = {
	type: ActionType
	label: string
	icon: string
	category: ActionCategory
}

export const actionTypes: readonly ActionTypeDefinition[] = [
	{
		type: ActionType.Swap,
		label: 'Swap',
		icon: '🔄',
		category: ActionCategory.ValueTransfer,
	},
	{
		type: ActionType.Bridge,
		label: 'Bridge',
		icon: '🌉',
		category: ActionCategory.ValueTransfer,
	},
	{
		type: ActionType.Transfer,
		label: 'Transfer',
		icon: '💸',
		category: ActionCategory.ValueTransfer,
	},
	{
		type: ActionType.CreateChannel,
		label: 'Create Channel',
		icon: '💛',
		category: ActionCategory.Channel,
	},
	{
		type: ActionType.AddChannelMember,
		label: 'Add Member',
		icon: '💛',
		category: ActionCategory.Channel,
	},
	{
		type: ActionType.CloseChannel,
		label: 'Close Channel',
		icon: '💛',
		category: ActionCategory.Channel,
	},
	{
		type: ActionType.AddLiquidity,
		label: 'Add Liquidity',
		icon: '💧',
		category: ActionCategory.Liquidity,
	},
	{
		type: ActionType.RemoveLiquidity,
		label: 'Remove Liquidity',
		icon: '💧',
		category: ActionCategory.Liquidity,
	},
	{
		type: ActionType.CollectFees,
		label: 'Collect Fees',
		icon: '💰',
		category: ActionCategory.Liquidity,
	},
	{
		type: ActionType.IncreaseLiquidity,
		label: 'Increase Liquidity',
		icon: '💧',
		category: ActionCategory.Liquidity,
	},
	{
		type: ActionType.ShareAddress,
		label: 'Share Address',
		icon: '📤',
		category: ActionCategory.Room,
	},
	{
		type: ActionType.ProposeTransfer,
		label: 'Propose Transfer',
		icon: '🤝',
		category: ActionCategory.Room,
	},
	{
		type: ActionType.RequestVerification,
		label: 'Request Verification',
		icon: '✅',
		category: ActionCategory.Room,
	},
	{
		type: ActionType.DepositToCustody,
		label: 'Deposit to Custody',
		icon: '🏦',
		category: ActionCategory.Custody,
	},
	{
		type: ActionType.WithdrawFromCustody,
		label: 'Withdraw from Custody',
		icon: '🏦',
		category: ActionCategory.Custody,
	},
	{
		type: ActionType.ResizeChannel,
		label: 'Resize Channel',
		icon: '💛',
		category: ActionCategory.Channel,
	},
	{
		type: ActionType.CreatePool,
		label: 'Create Pool',
		icon: '🏊',
		category: ActionCategory.Liquidity,
	},
	{
		type: ActionType.AcceptTransfer,
		label: 'Accept Transfer',
		icon: '✅',
		category: ActionCategory.Room,
	},
	{
		type: ActionType.RejectTransfer,
		label: 'Reject Transfer',
		icon: '❌',
		category: ActionCategory.Room,
	},
] as const

export const actionTypeDefinitionByActionType = Object.fromEntries(
	actionTypes.map(spec => [spec.type, spec]),
) as Record<ActionType, ActionTypeDefinition>


// Protocols

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


export type ProtocolSpec = {
	label: string
	shortLabel: string
	icon: string
	detail: string
}

const iconCircle = (await import('$/assets/providers/circle.svg?url')).default
const iconCctp = (await import('$/assets/providers/cctp.svg?url')).default
const iconLifi = (await import('$/assets/providers/lifi.svg?url')).default
const iconUniswap = (await import('$/assets/providers/uniswap.svg?url')).default

export const protocolSpecs = {
	[Protocol.UniswapV4]: {
		label: 'Uniswap V4',
		shortLabel: 'Uni V4',
		icon: iconUniswap,
		detail: 'Decentralized exchange',
	},
	[Protocol.LiFi]: {
		label: 'LI.FI',
		shortLabel: 'LI.FI',
		icon: iconLifi,
		detail: 'Multi-chain aggregator',
	},
	[Protocol.Yellow]: {
		label: 'Yellow Network',
		shortLabel: 'Yellow',
		icon: '💛',
		detail: 'State channel network',
	},
	[Protocol.Cctp]: {
		label: 'Circle CCTP',
		shortLabel: 'CCTP',
		icon: iconCctp,
		detail: 'Native USDC bridge',
	},
	[Protocol.PartyKit]: {
		label: 'PartyKit',
		shortLabel: 'PartyKit',
		icon: '🎉',
		detail: 'Real-time rooms',
	},
	[Protocol.Gateway]: {
		label: 'Circle Gateway',
		shortLabel: 'Gateway',
		icon: iconCircle,
		detail: 'Unified USDC balance',
	},
} as const satisfies Record<Protocol, ProtocolSpec>


// Protocol–Actions

export type ProtocolActionSpec = ProtocolAction & {
	supportsRecipient: boolean
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

export const protocolActions = [
	{ action: ActionType.Swap, protocol: Protocol.UniswapV4, supportsRecipient: true },
	{ action: ActionType.Swap, protocol: Protocol.LiFi, supportsRecipient: true },
	{ action: ActionType.Bridge, protocol: Protocol.Cctp, supportsRecipient: true },
	{ action: ActionType.Bridge, protocol: Protocol.LiFi, supportsRecipient: true },
	{ action: ActionType.Bridge, protocol: Protocol.Gateway, supportsRecipient: true },
	{ action: ActionType.Transfer, protocol: Protocol.Yellow, supportsRecipient: true },
	{ action: ActionType.Transfer, protocol: Protocol.LiFi, supportsRecipient: true },
	{ action: ActionType.CreateChannel, protocol: Protocol.Yellow, supportsRecipient: false },
	{ action: ActionType.AddChannelMember, protocol: Protocol.Yellow, supportsRecipient: false },
	{ action: ActionType.CloseChannel, protocol: Protocol.Yellow, supportsRecipient: false },
	{ action: ActionType.AddLiquidity, protocol: Protocol.UniswapV4, supportsRecipient: false },
	{ action: ActionType.RemoveLiquidity, protocol: Protocol.UniswapV4, supportsRecipient: true },
	{ action: ActionType.CollectFees, protocol: Protocol.UniswapV4, supportsRecipient: true },
	{ action: ActionType.IncreaseLiquidity, protocol: Protocol.UniswapV4, supportsRecipient: false },
	{ action: ActionType.ShareAddress, protocol: Protocol.PartyKit, supportsRecipient: false },
	{ action: ActionType.ProposeTransfer, protocol: Protocol.PartyKit, supportsRecipient: false },
	{ action: ActionType.RequestVerification, protocol: Protocol.PartyKit, supportsRecipient: false },
	{ action: ActionType.DepositToCustody, protocol: Protocol.Yellow, supportsRecipient: false },
	{ action: ActionType.WithdrawFromCustody, protocol: Protocol.Yellow, supportsRecipient: true },
	{ action: ActionType.ResizeChannel, protocol: Protocol.Yellow, supportsRecipient: false },
	{ action: ActionType.CreatePool, protocol: Protocol.UniswapV4, supportsRecipient: false },
	{ action: ActionType.AcceptTransfer, protocol: Protocol.PartyKit, supportsRecipient: false },
	{ action: ActionType.RejectTransfer, protocol: Protocol.PartyKit, supportsRecipient: false },
] as const satisfies ProtocolActionSpec[]


// Intents
export enum IntentType {
	SwapAndBridge = 'SwapAndBridge',
	SendFunds = 'SendFunds',
	SwapToCoin = 'SwapToCoin',
	CreateChannelAndAddMember = 'CreateChannelAndAddMember',
	CreateChannelAddMemberAndTransfer = 'CreateChannelAddMemberAndTransfer',
	AddLiquidity = 'AddLiquidity',
	ManagePosition = 'ManagePosition',
	IncreasePositionLiquidity = 'IncreasePositionLiquidity',
	ShareAddressInRoom = 'ShareAddressInRoom',
	ProposeRoomTransfer = 'ProposeRoomTransfer',
	RequestPeerVerification = 'RequestPeerVerification',
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

export type IntentOption = {
	label: string
	actions: ProtocolActionPayload[]
}

const eqAddr = (a: unknown, b: unknown) => (
	typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase()
)

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
			{
				label: 'Bridge via Circle Gateway',
				actions: [
					{
						protocolAction: { action: ActionType.Bridge, protocol: Protocol.Gateway },
						payload: { fromActorCoin, toActorCoin: toActorNetwork },
					},
				],
			},
		],
	},

	{
		type: IntentType.SendFunds,
		label: 'Send',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'from',
					dropTarget: 'to',
				},
			},
		],

		entities: [
			{ name: 'from', type: EntityType.ActorCoin },
			{ name: 'to', type: EntityType.ActorCoin },
		],

		resolveOptions: ({ from, to }) => {
			const sameActor = eqAddr(from.address, to.address)
			const sameNetwork = from.chainId === to.chainId
			const sameCoin = eqAddr(from.tokenAddress, to.tokenAddress)

			if (sameActor && sameNetwork && sameCoin)
				throw new Error('Source and destination are identical')

			const payload = { fromActorCoin: from, toActorCoin: to }

			return [
				// LiFi handles swap + bridge + cross-actor delivery natively via toAddress
				...(!sameCoin || !sameNetwork ? [{
					label: [!sameCoin && 'Swap', !sameNetwork && 'Bridge'].filter(Boolean).join(' + ') + ' via LiFi',
					actions: [
						...(!sameCoin ? [{ protocolAction: { action: ActionType.Swap, protocol: Protocol.LiFi }, payload }] : []),
						...(!sameNetwork ? [{ protocolAction: { action: ActionType.Bridge, protocol: Protocol.LiFi }, payload }] : []),
					],
				}] : []),

				// Uniswap V4 swap + CCTP bridge (mintRecipient handles cross-actor)
				...(!sameCoin || !sameNetwork ? [{
					label: 'Via ' + [!sameCoin && 'Uniswap V4', !sameNetwork && 'CCTP'].filter(Boolean).join(' + '),
					actions: [
						...(!sameCoin ? [{ protocolAction: { action: ActionType.Swap, protocol: Protocol.UniswapV4 }, payload }] : []),
						...(!sameNetwork ? [{ protocolAction: { action: ActionType.Bridge, protocol: Protocol.Cctp }, payload }] : []),
					],
				}] : []),

				// Gateway bridge (destinationRecipient handles cross-actor)
				...(!sameNetwork ? [{
					label: 'Via ' + [!sameCoin && 'Uniswap V4', 'Gateway'].filter(Boolean).join(' + '),
					actions: [
						...(!sameCoin ? [{ protocolAction: { action: ActionType.Swap, protocol: Protocol.UniswapV4 }, payload }] : []),
						{ protocolAction: { action: ActionType.Bridge, protocol: Protocol.Gateway }, payload },
					],
				}] : []),

				// Transfer only (same coin + same network + different actor)
				...(sameCoin && sameNetwork && !sameActor ? [
					{
						label: 'Transfer via LiFi',
						actions: [{ protocolAction: { action: ActionType.Transfer, protocol: Protocol.LiFi }, payload }],
					},
					{
						label: 'Transfer via Yellow',
						actions: [{ protocolAction: { action: ActionType.Transfer, protocol: Protocol.Yellow }, payload }],
					},
				] : []),
			]
		},
	},

	{
		type: IntentType.SwapToCoin,
		label: 'Swap',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'actorCoin',
					dropTarget: 'coin',
				},
			},
		],

		entities: [
			{ name: 'actorCoin', type: EntityType.ActorCoin },
			{ name: 'coin', type: EntityType.Coin },
		],

		resolveOptions: ({ actorCoin, coin }) => [
			{
				label: 'Swap via Uniswap V4',
				actions: [
					{
						protocolAction: { action: ActionType.Swap, protocol: Protocol.UniswapV4 },
						payload: { fromActorCoin: actorCoin, toActorCoin: coin },
					},
				],
			},
			{
				label: 'Swap via LiFi',
				actions: [
					{
						protocolAction: { action: ActionType.Swap, protocol: Protocol.LiFi },
						payload: { fromActorCoin: actorCoin, toActorCoin: coin },
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
			{
				name: 'toActor',
				type: EntityType.Actor,
				match: (id) => (
					(id as { rejectMatch?: boolean }).rejectMatch === true
						? { result: false, error: 'rejected by predicate' }
						: { result: true, reason: 'ok' }
				),
			},
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
		type: IntentType.ManagePosition,
		label: 'Manage Position',

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
				label: 'Collect fees via Uniswap V4',
				actions: [
					{
						protocolAction: { action: ActionType.CollectFees, protocol: Protocol.UniswapV4 },
						payload: { position, actor },
					},
				],
			},
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

	{
		type: IntentType.IncreasePositionLiquidity,
		label: 'Increase Liquidity',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'actorCoin',
					dropTarget: 'position',
				},
			},
		],

		entities: [
			{ name: 'actorCoin', type: EntityType.ActorCoin },
			{ name: 'position', type: EntityType.UniswapPosition },
		],

		resolveOptions: ({ actorCoin, position }) => [
			{
				label: 'Increase liquidity via Uniswap V4',
				actions: [
					{
						protocolAction: { action: ActionType.IncreaseLiquidity, protocol: Protocol.UniswapV4 },
						payload: { actorCoin, position },
					},
				],
			},
		],
	},

	{
		type: IntentType.ShareAddressInRoom,
		label: 'Share Address',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'actor',
					dropTarget: 'room',
				},
			},
		],

		entities: [
			{ name: 'actor', type: EntityType.Actor },
			{ name: 'room', type: EntityType.Room },
		],

		resolveOptions: ({ actor, room }) => [
			{
				label: 'Share address in room via PartyKit',
				actions: [
					{
						protocolAction: { action: ActionType.ShareAddress, protocol: Protocol.PartyKit },
						payload: { actor, room },
					},
				],
			},
		],
	},

	{
		type: IntentType.ProposeRoomTransfer,
		label: 'Propose Transfer',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'actorCoin',
					dropTarget: 'peer',
				},
			},
		],

		entities: [
			{ name: 'actorCoin', type: EntityType.ActorCoin },
			{ name: 'peer', type: EntityType.RoomPeer },
		],

		resolveOptions: ({ actorCoin, peer }) => [
			{
				label: 'Propose transfer to peer via PartyKit',
				actions: [
					{
						protocolAction: { action: ActionType.ProposeTransfer, protocol: Protocol.PartyKit },
						payload: { fromActorCoin: actorCoin, toPeer: peer },
					},
				],
			},
		],
	},

	{
		type: IntentType.RequestPeerVerification,
		label: 'Request Verification',

		invocations: [
			{
				modality: IntentInvocationModality.DragAndDrop,
				entities: {
					dragTarget: 'actor',
					dropTarget: 'peer',
				},
			},
		],

		entities: [
			{ name: 'actor', type: EntityType.Actor },
			{ name: 'peer', type: EntityType.RoomPeer },
		],

		resolveOptions: ({ actor, peer }) => [
			{
				label: 'Request SIWE verification via PartyKit',
				actions: [
					{
						protocolAction: { action: ActionType.RequestVerification, protocol: Protocol.PartyKit },
						payload: { actor, peer },
					},
				],
			},
		],
	},
]
