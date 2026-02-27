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
	BridgeQuoteItems = 'BridgeQuoteItems',
	BridgeRouteItems = 'BridgeRouteItems',
	SocialPostSessions = 'SocialPostSessions',
	BridgeRoutes = 'BridgeRoutes',
	BridgeTransactions = 'BridgeTransactions',
	Contracts = 'Contracts',
	EvmErrors = 'EvmErrors',
	EvmSelectors = 'EvmSelectors',
	EvmTopics = 'EvmTopics',
	NetworkTransactions = 'NetworkTransactions',
	Coins = 'Coins',
	CctpAllowance = 'CctpAllowance',
	CctpFees = 'CctpFees',
	ChainIdChains = 'ChainIdChains',
	Dashboards = 'Dashboards',
	Proposals = 'Proposals',
	Caips = 'Caips',
	Eip8004Services = 'Eip8004Services',
	EntitySources = 'EntitySources',
	EnsAvatars = 'EnsAvatars',
	EvmActorProfiles = 'EvmActorProfiles',
	FarcasterCasts = 'FarcasterCasts',
	FarcasterChannels = 'FarcasterChannels',
	FarcasterConnections = 'FarcasterConnections',
	FarcasterLinks = 'FarcasterLinks',
	FarcasterUsers = 'FarcasterUsers',
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
	BridgeTransferEvents = 'BridgeTransferEvents',
	SwapTransferEvents = 'SwapTransferEvents',
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
