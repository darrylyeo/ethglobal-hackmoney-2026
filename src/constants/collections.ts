/**
 * TanStack DB collection ids and profile-scoped storage keys.
 * TitleCase enum values used for both collection `id` and localStorage `storageKey`.
 */

/** Profile-scoped localStorage key for persistent room peer id (not a TanStack collection). */
export const ROOM_PERSISTENT_PEER_ID_STORAGE_KEY = 'RoomPersistentPeerId'

export enum CollectionId {
	ActorAllowances = 'ActorAllowances',
	ActorCoins = 'ActorCoins',
	Actors = 'Actors',
	AgentChatTrees = 'AgentChatTrees',
	AgentChatTurns = 'AgentChatTurns',
	Blocks = 'Blocks',
	BridgeRouteItems = 'BridgeRouteItems',
	BridgeRoutes = 'BridgeRoutes',
	BridgeTransactions = 'BridgeTransactions',
	Contracts = 'Contracts',
	NetworkTransactions = 'NetworkTransactions',
	Coins = 'Coins',
	CctpAllowance = 'CctpAllowance',
	CctpFees = 'CctpFees',
	Dashboards = 'Dashboards',
	EntitySources = 'EntitySources',
	EnsAvatars = 'EnsAvatars',
	EvmActorProfiles = 'EvmActorProfiles',
	IdentityLinks = 'IdentityLinks',
	LlmConnections = 'LlmConnections',
	MyPeerIds = 'MyPeerIds',
	Networks = 'Networks',
	PartykitRoomPeers = 'PartykitRoomPeers',
	PartykitRooms = 'PartykitRooms',
	SharedAddresses = 'SharedAddresses',
	SiweChallenges = 'SiweChallenges',
	SpandexProviders = 'SpandexProviders',
	SpandexQuoteItems = 'SpandexQuoteItems',
	StorkPrices = 'StorkPrices',
	SwapQuotes = 'SwapQuotes',
	TokenListCoins = 'TokenListCoins',
	SessionActionTransactionSimulations = 'SessionActionTransactionSimulations',
	SessionActionTransactions = 'SessionActionTransactions',
	SessionActions = 'SessionActions',
	SessionSimulations = 'SessionSimulations',
	Sessions = 'Sessions',
	TransferEvents = 'TransferEvents',
	TransactionTraces = 'TransactionTraces',
	TransferGraphs = 'TransferGraphs',
	TransferRequests = 'TransferRequests',
	UniswapPositions = 'UniswapPositions',
	UniswapPools = 'UniswapPools',
	VerifiedContractSources = 'VerifiedContractSources',
	SiweVerifications = 'SiweVerifications',
	WalletConnections = 'WalletConnections',
	Wallets = 'Wallets',
	WatchedEntities = 'WatchedEntities',
	StateChannelStates = 'StateChannelStates',
	StateChannels = 'StateChannels',
	StateChannelDeposits = 'StateChannelDeposits',
	StateChannelTransfers = 'StateChannelTransfers',
}

export const collectionEntries: readonly { id: CollectionId }[] = (
	Object.values(CollectionId) as CollectionId[]
).map((id) => ({ id }))

export const collectionsById = Object.fromEntries(
	collectionEntries.map((e) => [e.id, e]),
) as Record<CollectionId, { id: CollectionId }>
