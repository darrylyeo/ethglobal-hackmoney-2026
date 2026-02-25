import type { Type } from 'arktype'
import { type } from 'arktype'
import { ActionType } from '$/constants/actions.ts'
import { ProtocolId } from '$/constants/protocols.ts'

export type ProtocolAction = {
	id: {
		actionType: ActionType
		protocol: ProtocolId
	}
	payloadSchema: Type
}

export const protocolActions = [
	{
		id: {
			actionType: ActionType.Swap,
			protocol: ProtocolId.UniswapV4,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Swap,
			protocol: ProtocolId.LiFi,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Swap,
			protocol: ProtocolId.Odos,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Swap,
			protocol: ProtocolId.KyberSwap,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Swap,
			protocol: ProtocolId.Relay,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Swap,
			protocol: ProtocolId.NearIntents,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Bridge,
			protocol: ProtocolId.Cctp,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Bridge,
			protocol: ProtocolId.LiFi,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Bridge,
			protocol: ProtocolId.CircleGateway,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Bridge,
			protocol: ProtocolId.NearIntents,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Transfer,
			protocol: ProtocolId.Yellow,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Transfer,
			protocol: ProtocolId.LiFi,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.CreateChannel,
			protocol: ProtocolId.Yellow,
		},
		payloadSchema: type({
			actor: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.AddChannelMember,
			protocol: ProtocolId.Yellow,
		},
		payloadSchema: type({
			actor: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.CloseChannel,
			protocol: ProtocolId.Yellow,
		},
		payloadSchema: type({
			channel: 'object',
			actor: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.AddLiquidity,
			protocol: ProtocolId.UniswapV4,
		},
		payloadSchema: type({
			actorCoin: 'object',
			pool: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.RemoveLiquidity,
			protocol: ProtocolId.UniswapV4,
		},
		payloadSchema: type({
			position: 'object',
			actor: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.CollectFees,
			protocol: ProtocolId.UniswapV4,
		},
		payloadSchema: type({
			position: 'object',
			actor: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.IncreaseLiquidity,
			protocol: ProtocolId.UniswapV4,
		},
		payloadSchema: type({
			actorCoin: 'object',
			position: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.ShareAddress,
			protocol: ProtocolId.PartyKit,
		},
		payloadSchema: type({
			actor: 'object',
			room: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.ProposeTransfer,
			protocol: ProtocolId.PartyKit,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toPeer: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.RequestVerification,
			protocol: ProtocolId.PartyKit,
		},
		payloadSchema: type({
			actor: 'object',
			peer: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.DepositToCustody,
			protocol: ProtocolId.Yellow,
		},
		payloadSchema: type({
			actorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.WithdrawFromCustody,
			protocol: ProtocolId.Yellow,
		},
		payloadSchema: type({
			actorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.ResizeChannel,
			protocol: ProtocolId.Yellow,
		},
		payloadSchema: type({
			channel: 'object',
			actorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.CreatePool,
			protocol: ProtocolId.UniswapV4,
		},
		payloadSchema: type({
			token0: 'object',
			token1: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.AcceptTransfer,
			protocol: ProtocolId.PartyKit,
		},
		payloadSchema: type({
			transferRequest: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.RejectTransfer,
			protocol: ProtocolId.PartyKit,
		},
		payloadSchema: type({
			transferRequest: 'object',
		}),
	},
] as const satisfies readonly ProtocolAction[]

export type ProtocolActionEntry = (typeof protocolActions)[number]

export const protocolActionByActionAndProtocol: Partial<
	Record<`${ActionType}:${ProtocolId}`, ProtocolActionEntry>
> = Object.fromEntries(
	protocolActions.map((pa) => [
		`${pa.id.actionType}:${pa.id.protocol}` as `${ActionType}:${ProtocolId}`,
		pa,
	]),
)

