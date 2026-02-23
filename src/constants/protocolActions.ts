import type { Type } from 'arktype'
import { type } from 'arktype'
import { ActionType } from '$/constants/actions.ts'
import { Protocol } from '$/constants/protocols.ts'

export type ProtocolAction = {
	id: {
		actionType: ActionType
		protocol: Protocol
	}
	payloadSchema: Type
}

export const protocolActions = [
	{
		id: {
			actionType: ActionType.Swap,
			protocol: Protocol.UniswapV4,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Swap,
			protocol: Protocol.LiFi,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Swap,
			protocol: Protocol.Odos,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Swap,
			protocol: Protocol.KyberSwap,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Swap,
			protocol: Protocol.Relay,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Bridge,
			protocol: Protocol.Cctp,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Bridge,
			protocol: Protocol.LiFi,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Bridge,
			protocol: Protocol.CircleGateway,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Transfer,
			protocol: Protocol.Yellow,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.Transfer,
			protocol: Protocol.LiFi,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toActorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.CreateChannel,
			protocol: Protocol.Yellow,
		},
		payloadSchema: type({
			actor: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.AddChannelMember,
			protocol: Protocol.Yellow,
		},
		payloadSchema: type({
			actor: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.CloseChannel,
			protocol: Protocol.Yellow,
		},
		payloadSchema: type({
			channel: 'object',
			actor: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.AddLiquidity,
			protocol: Protocol.UniswapV4,
		},
		payloadSchema: type({
			actorCoin: 'object',
			pool: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.RemoveLiquidity,
			protocol: Protocol.UniswapV4,
		},
		payloadSchema: type({
			position: 'object',
			actor: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.CollectFees,
			protocol: Protocol.UniswapV4,
		},
		payloadSchema: type({
			position: 'object',
			actor: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.IncreaseLiquidity,
			protocol: Protocol.UniswapV4,
		},
		payloadSchema: type({
			actorCoin: 'object',
			position: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.ShareAddress,
			protocol: Protocol.PartyKit,
		},
		payloadSchema: type({
			actor: 'object',
			room: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.ProposeTransfer,
			protocol: Protocol.PartyKit,
		},
		payloadSchema: type({
			fromActorCoin: 'object',
			toPeer: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.RequestVerification,
			protocol: Protocol.PartyKit,
		},
		payloadSchema: type({
			actor: 'object',
			peer: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.DepositToCustody,
			protocol: Protocol.Yellow,
		},
		payloadSchema: type({
			actorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.WithdrawFromCustody,
			protocol: Protocol.Yellow,
		},
		payloadSchema: type({
			actorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.ResizeChannel,
			protocol: Protocol.Yellow,
		},
		payloadSchema: type({
			channel: 'object',
			actorCoin: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.CreatePool,
			protocol: Protocol.UniswapV4,
		},
		payloadSchema: type({
			token0: 'object',
			token1: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.AcceptTransfer,
			protocol: Protocol.PartyKit,
		},
		payloadSchema: type({
			transferRequest: 'object',
		}),
	},
	{
		id: {
			actionType: ActionType.RejectTransfer,
			protocol: Protocol.PartyKit,
		},
		payloadSchema: type({
			transferRequest: 'object',
		}),
	},
] as const satisfies readonly ProtocolAction[]

export type ProtocolActionEntry = (typeof protocolActions)[number]

export const protocolActionByActionAndProtocol: Partial<
	Record<`${ActionType}:${Protocol}`, ProtocolActionEntry>
> = Object.fromEntries(
	protocolActions.map((pa) => [
		`${pa.id.actionType}:${pa.id.protocol}` as `${ActionType}:${Protocol}`,
		pa,
	]),
)

