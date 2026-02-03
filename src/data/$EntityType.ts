/**
 * Singular entity type names for collections. Use these instead of ad-hoc strings.
 * Each collection stores one entity type; the constant is the canonical key for that type.
 */

export enum EntityType {
	Actor = 'Actor',
	ActorAllowance = 'ActorAllowance',
	ActorCoin = 'ActorCoin',
	BridgeRoute = 'BridgeRoute',
	ChannelProposal = 'ChannelProposal',
	Coin = 'Coin',
	Network = 'Network',
	Room = 'Room',
	RoomPeer = 'RoomPeer',
	SharedAddress = 'SharedAddress',
	SiweChallenge = 'SiweChallenge',
	StorkPrice = 'StorkPrice',
	SwapQuote = 'SwapQuote',
	TokenListCoin = 'TokenListCoin',
	Transaction = 'Transaction',
	UniswapPool = 'UniswapPool',
	UniswapPosition = 'UniswapPosition',
	Wallet = 'Wallet',
	WalletConnection = 'WalletConnection',
	YellowChannel = 'YellowChannel',
	YellowChannelState = 'YellowChannelState',
	YellowDeposit = 'YellowDeposit',
	YellowTransfer = 'YellowTransfer',
}

/** Entity types shown in the graph scene (subset of EntityType). */
export const GRAPH_SCENE_ENTITY_TYPES = [
	EntityType.Wallet,
	EntityType.WalletConnection,
	EntityType.Actor,
	EntityType.ActorCoin,
	EntityType.ActorAllowance,
	EntityType.BridgeRoute,
	EntityType.Transaction,
] as const satisfies EntityType[]

export type GraphSceneEntityType = (typeof GRAPH_SCENE_ENTITY_TYPES)[number]
