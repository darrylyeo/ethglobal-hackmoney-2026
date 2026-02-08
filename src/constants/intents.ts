import {
	ActionType,
	actionTypeDefinitionByActionType,
	createAction,
} from '$/constants/actions.ts'
import {
	getActionType,
	getProtocolAction,
	protocolActions,
} from '$/constants/protocolActions.ts'
import { Protocol, protocolsById } from '$/constants/protocols.ts'
import type { ProtocolAction } from '$/constants/protocolActions.ts'
import type { SessionTemplate } from '$/data/Session.ts'
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


// Re-export action constants for consumers that import from intents
export {
	ActionType,
	actionTypeDefinitionByActionType,
	actionTypes,
	type ActionTypeDefinition,
} from '$/constants/actions.ts'


export { protocolActions } from '$/constants/protocolActions.ts'
export type { ProtocolAction } from '$/constants/protocolActions.ts'
export { Protocol, protocolsById as protocolSpecs } from '$/constants/protocols.ts'
export type { ProtocolDefinition as ProtocolSpec } from '$/constants/protocols.ts'

const listFormatUnit = new Intl.ListFormat('en', { type: 'unit', style: 'long' })

export function formatIntentOptionLabel(protocolActions: readonly ProtocolAction[]): string {
	if (protocolActions.length === 0) return ''
	const first = protocolActions[0]
	if (protocolActions.length === 1)
		return `${actionTypeDefinitionByActionType[first.id.actionType].label} via ${protocolsById[first.id.protocol].label}`
	const sameProtocol = protocolActions.every((pa) => pa.id.protocol === first.id.protocol)
	if (sameProtocol)
		return (
			protocolActions
				.map((pa, i) => (
					i === 0
						? actionTypeDefinitionByActionType[pa.id.actionType].label
						: actionTypeDefinitionByActionType[pa.id.actionType].label.toLowerCase()
				))
				.join(' then ')
			+ ` via ${protocolsById[first.id.protocol].label}`
		)
	const parts = protocolActions.map((pa, i) => (
		(i === 0
			? actionTypeDefinitionByActionType[pa.id.actionType].label
			: actionTypeDefinitionByActionType[pa.id.actionType].label.toLowerCase())
		+ ` via ${protocolsById[pa.id.protocol].label}`
	))
	return listFormatUnit.format(parts)
}

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
	name: string
	sessionTemplate: SessionTemplate
}

type ProtocolActionWithPayload = {
	protocolAction: (typeof protocolActions)[number]
	payload: Record<string, unknown>
}

const toIntentOption = (
	name: string,
	protocolActions: ProtocolActionWithPayload[],
): IntentOption => ({
	name,
	sessionTemplate: {
		name,
		actions: protocolActions.map(({ protocolAction }) =>
			createAction(getActionType(protocolAction))),
	},
})

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

		resolveOptions: ({ fromActorCoin, toActorNetwork }) => {
			const payload = { fromActorCoin, toActorCoin: toActorNetwork }
			const lifi = [
				{ protocolAction: getProtocolAction(ActionType.Swap, Protocol.LiFi), payload },
				{ protocolAction: getProtocolAction(ActionType.Bridge, Protocol.LiFi), payload },
			]
			const uniswapCctp = [
				{ protocolAction: getProtocolAction(ActionType.Swap, Protocol.UniswapV4), payload },
				{ protocolAction: getProtocolAction(ActionType.Bridge, Protocol.Cctp), payload },
			]
			const gateway = [
				{ protocolAction: getProtocolAction(ActionType.Bridge, Protocol.CircleGateway), payload },
			]
			return [
				toIntentOption(formatIntentOptionLabel(lifi.map((a) => a.protocolAction)), lifi),
				toIntentOption(formatIntentOptionLabel(uniswapCctp.map((a) => a.protocolAction)), uniswapCctp),
				toIntentOption(formatIntentOptionLabel(gateway.map((a) => a.protocolAction)), gateway),
			]
		},
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

			const lifiActions = [
				...(!sameCoin ? [{ protocolAction: getProtocolAction(ActionType.Swap, Protocol.LiFi), payload }] : []),
				...(!sameNetwork ? [{ protocolAction: getProtocolAction(ActionType.Bridge, Protocol.LiFi), payload }] : []),
			]
			const uniswapCctpActions = [
				...(!sameCoin ? [{ protocolAction: getProtocolAction(ActionType.Swap, Protocol.UniswapV4), payload }] : []),
				...(!sameNetwork ? [{ protocolAction: getProtocolAction(ActionType.Bridge, Protocol.Cctp), payload }] : []),
			]
			const gatewayActions = [
				...(!sameCoin ? [{ protocolAction: getProtocolAction(ActionType.Swap, Protocol.UniswapV4), payload }] : []),
				{ protocolAction: getProtocolAction(ActionType.Bridge, Protocol.CircleGateway), payload },
			]
			return [
				...(!sameCoin || !sameNetwork ? [toIntentOption(formatIntentOptionLabel(lifiActions.map((a) => a.protocolAction)), lifiActions)] : []),
				...(!sameCoin || !sameNetwork ? [toIntentOption(formatIntentOptionLabel(uniswapCctpActions.map((a) => a.protocolAction)), uniswapCctpActions)] : []),
				...(!sameNetwork ? [toIntentOption(formatIntentOptionLabel(gatewayActions.map((a) => a.protocolAction)), gatewayActions)] : []),
				...(sameCoin && sameNetwork && !sameActor ? [
					toIntentOption(formatIntentOptionLabel([getProtocolAction(ActionType.Transfer, Protocol.LiFi)]), [{ protocolAction: getProtocolAction(ActionType.Transfer, Protocol.LiFi), payload }]),
					toIntentOption(formatIntentOptionLabel([getProtocolAction(ActionType.Transfer, Protocol.Yellow)]), [{ protocolAction: getProtocolAction(ActionType.Transfer, Protocol.Yellow), payload }]),
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

		resolveOptions: ({ actorCoin, coin }) => {
			const payload = { fromActorCoin: actorCoin, toActorCoin: coin }
			const uniswap = [{ protocolAction: getProtocolAction(ActionType.Swap, Protocol.UniswapV4), payload }]
			const lifi = [{ protocolAction: getProtocolAction(ActionType.Swap, Protocol.LiFi), payload }]
			return [
				toIntentOption(formatIntentOptionLabel(uniswap.map((a) => a.protocolAction)), uniswap),
				toIntentOption(formatIntentOptionLabel(lifi.map((a) => a.protocolAction)), lifi),
			]
		},
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
			toIntentOption('Create EIP-7824 channel + Add member', [
				{
					protocolAction: getProtocolAction(ActionType.CreateChannel, Protocol.Yellow),
					payload: { actor: fromActor },
				},
				{
					protocolAction: getProtocolAction(ActionType.AddChannelMember, Protocol.Yellow),
					payload: { actor: toActor },
				},
			]),
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
			toIntentOption('Create EIP-7824 channel + Add member + Transfer', [
				{
					protocolAction: getProtocolAction(ActionType.CreateChannel, Protocol.Yellow),
					payload: { actor: fromActorCoin },
				},
				{
					protocolAction: getProtocolAction(ActionType.AddChannelMember, Protocol.Yellow),
					payload: { actor: toActor },
				},
				{
					protocolAction: getProtocolAction(ActionType.Transfer, Protocol.Yellow),
					payload: { fromActorCoin, toActorCoin: toActor },
				},
			]),
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
			toIntentOption('Add liquidity via Uniswap V4', [
				{
					protocolAction: getProtocolAction(ActionType.AddLiquidity, Protocol.UniswapV4),
					payload: { actorCoin, pool },
				},
			]),
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
			toIntentOption('Collect fees via Uniswap V4', [
				{
					protocolAction: getProtocolAction(ActionType.CollectFees, Protocol.UniswapV4),
					payload: { position, actor },
				},
			]),
			toIntentOption('Remove liquidity via Uniswap V4', [
				{
					protocolAction: getProtocolAction(ActionType.RemoveLiquidity, Protocol.UniswapV4),
					payload: { position, actor },
				},
			]),
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
			toIntentOption('Increase liquidity via Uniswap V4', [
				{
					protocolAction: getProtocolAction(ActionType.IncreaseLiquidity, Protocol.UniswapV4),
					payload: { actorCoin, position },
				},
			]),
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
			toIntentOption('Share address in room via PartyKit', [
				{
					protocolAction: getProtocolAction(ActionType.ShareAddress, Protocol.PartyKit),
					payload: { actor, room },
				},
			]),
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
			toIntentOption('Propose transfer to peer via PartyKit', [
				{
					protocolAction: getProtocolAction(ActionType.ProposeTransfer, Protocol.PartyKit),
					payload: { fromActorCoin: actorCoin, toPeer: peer },
				},
			]),
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
			toIntentOption('Request SIWE verification via PartyKit', [
				{
					protocolAction: getProtocolAction(ActionType.RequestVerification, Protocol.PartyKit),
					payload: { actor, peer },
				},
			]),
		],
	},
]
