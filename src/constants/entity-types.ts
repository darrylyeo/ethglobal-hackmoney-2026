/**
 * Singular entity type names for collections. Use these instead of ad-hoc strings.
 * Each collection stores one entity type; the constant is the canonical key for that type.
 */

export const ENTITY_TYPE = {
	wallet: 'wallet',
	walletConnection: 'walletConnection',
	actor: 'actor',
	actorCoin: 'actorCoin',
	actorAllowance: 'actorAllowance',
	bridgeRoute: 'bridgeRoute',
	transaction: 'transaction',
	swapQuote: 'swapQuote',
	storkPrice: 'storkPrice',
	tokenListCoin: 'tokenListCoin',
	room: 'room',
	roomPeer: 'roomPeer',
	channelProposal: 'channelProposal',
	sharedAddress: 'sharedAddress',
	siweChallenge: 'siweChallenge',
	yellowChannel: 'yellowChannel',
	yellowChannelState: 'yellowChannelState',
	yellowDeposit: 'yellowDeposit',
	yellowTransfer: 'yellowTransfer',
	uniswapPool: 'uniswapPool',
	uniswapPosition: 'uniswapPosition',
	network: 'network',
	coin: 'coin',
} as const

export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE]

/** Entity types shown in the graph scene (subset of EntityType). */
export const GRAPH_SCENE_ENTITY_TYPES: EntityType[] = [
	ENTITY_TYPE.wallet,
	ENTITY_TYPE.walletConnection,
	ENTITY_TYPE.actor,
	ENTITY_TYPE.actorCoin,
	ENTITY_TYPE.actorAllowance,
	ENTITY_TYPE.bridgeRoute,
	ENTITY_TYPE.transaction,
]

export type GraphSceneEntityType = (typeof GRAPH_SCENE_ENTITY_TYPES)[number]
