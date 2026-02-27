/**
 * Entity type enum and metadata: label (singular) and labelPlural for UI.
 * Use these instead of ad-hoc strings.
 */

import type { Actor, Actor$Id } from '$/data/Actor.ts'
import type { ActorAllowance, ActorAllowance$Id } from '$/data/ActorAllowance.ts'
import type { ActorCoin, ActorCoin$Id } from '$/data/ActorCoin.ts'
import type { AgentChatTree } from '$/data/AgentChatTree.ts'
import type { AgentChatTurn } from '$/data/AgentChatTurn.ts'
import type { BlockEntry, Block$Id } from '$/data/Block.ts'
import type { BridgeRoute } from '$/data/BridgeRoute.ts'
import type { CctpAllowance, CctpAllowance$Id } from '$/data/CctpAllowance.ts'
import type { CctpFee, CctpFee$Id } from '$/data/CctpFee.ts'
import type { ContractEntry, Contract$Id } from '$/data/Contract.ts'
import type { SocialPostSession } from '$/data/SocialPostSession.ts'
import type { FarcasterCast, FarcasterCast$Id } from '$/data/FarcasterCast.ts'
import type { FarcasterChannel, FarcasterChannel$Id } from '$/data/FarcasterChannel.ts'
import type { FarcasterUser, FarcasterUser$Id } from '$/data/FarcasterUser.ts'
import type { CoinInstanceEntry, CoinInstance$Id } from '$/constants/coin-instances.ts'
import type { DashboardState, DashboardState$Id } from '$/data/DashboardPanel.ts'
import type { NetworkEntry, Network$Id } from '$/data/Network.ts'
import type { Room } from '$/data/Room.ts'
import type { RoomPeer } from '$/data/RoomPeer.ts'
import type { SharedAddress } from '$/data/SharedAddress.ts'
import type { SiweChallenge } from '$/data/SiweChallenge.ts'
import type { StorkPrice, StorkPrice$Id } from '$/data/StorkPrice.ts'
import type { SwapQuote } from '$/data/SwapQuote.ts'
import type { TokenListCoin, TokenListCoin$Id } from '$/data/TokenListCoin.ts'
import type { Transaction, Transaction$Id } from '$/data/Transaction.ts'
import type { Session } from '$/data/Session.ts'
import type { SessionSimulation } from '$/data/SessionSimulation.ts'
import type { TransferRequest } from '$/data/TransferRequest.ts'
import type { UniswapPool } from '$/data/UniswapPool.ts'
import type { UniswapPosition } from '$/data/UniswapPosition.ts'
import type { Wallet, Wallet$Id } from '$/data/Wallet.ts'
import type { WalletConnectionBase, WalletConnection$Id } from '$/data/WalletConnection.ts'
import type { YellowChannel } from '$/data/YellowChannel.ts'
import type { YellowChannelState } from '$/data/YellowChannelState.ts'
import type { Fork } from '$/constants/forks/types.ts'
import type { Eip8004Service, Eip8004Service$Id } from '$/data/Eip8004Service.ts'
import type { CaipEntry, CaipEntry$Id } from '$/data/CaipEntry.ts'
import type { ProposalEntry, ProposalEntry$Id } from '$/data/ProposalEntry.ts'
import type { EvmError, EvmError$Id } from '$/data/EvmError.ts'
import type { EvmSelector, EvmSelector$Id } from '$/data/EvmSelector.ts'
import type { EvmTopic, EvmTopic$Id } from '$/data/EvmTopic.ts'
import type { YellowDeposit } from '$/data/YellowDeposit.ts'
import type { YellowTransfer } from '$/data/YellowTransfer.ts'

export enum EntityType {
	Actor = 'Actor',
	ActorAllowance = 'ActorAllowance',
	ActorCoin = 'ActorCoin',
	ActorNetwork = 'ActorNetwork',
	AgentChatTree = 'AgentChatTree',
	AgentChatTurn = 'AgentChatTurn',
	Block = 'Block',
	BridgeRoute = 'BridgeRoute',
	CctpAllowance = 'CctpAllowance',
	CctpFee = 'CctpFee',
	ChannelProposal = 'ChannelProposal',
	Coin = 'Coin',
	ConsensusEpoch = 'ConsensusEpoch',
	Contract = 'Contract',
	Dashboard = 'Dashboard',
	Eip8004Service = 'Eip8004Service',
	Caip = 'Caip',
	NetworkFork = 'NetworkFork',
	EvmError = 'EvmError',
	EvmSelector = 'EvmSelector',
	EvmTopic = 'EvmTopic',
	Proposal = 'Proposal',
	SocialPostSession = 'SocialPostSession',
	FarcasterCast = 'FarcasterCast',
	FarcasterChannel = 'FarcasterChannel',
	FarcasterUser = 'FarcasterUser',
	Network = 'Network',
	Room = 'Room',
	RoomPeer = 'RoomPeer',
	SharedAddress = 'SharedAddress',
	SiweChallenge = 'SiweChallenge',
	StorkPrice = 'StorkPrice',
	SwapQuote = 'SwapQuote',
	TokenListCoin = 'TokenListCoin',
	Transaction = 'Transaction',
	Session = 'Session',
	SessionSimulation = 'SessionSimulation',
	TransferGraph = 'TransferGraph',
	TransferRequest = 'TransferRequest',
	UniswapPool = 'UniswapPool',
	UniswapPosition = 'UniswapPosition',
	Wallet = 'Wallet',
	WalletConnection = 'WalletConnection',
	StateChannel = 'StateChannel',
	StateChannelState = 'StateChannelState',
	StateChannelDeposit = 'StateChannelDeposit',
	StateChannelTransfer = 'StateChannelTransfer',
}

export const graphSceneEntityTypes = [
	EntityType.Actor,
	EntityType.ActorAllowance,
	EntityType.ActorCoin,
	EntityType.ActorNetwork,
	EntityType.Block,
	EntityType.BridgeRoute,
	EntityType.CctpAllowance,
	EntityType.CctpFee,
	EntityType.Coin,
	EntityType.Contract,
	EntityType.Dashboard,
	EntityType.Eip8004Service,
	EntityType.SocialPostSession,
	EntityType.FarcasterCast,
	EntityType.FarcasterChannel,
	EntityType.FarcasterUser,
	EntityType.Network,
	EntityType.Room,
	EntityType.RoomPeer,
	EntityType.SharedAddress,
	EntityType.SiweChallenge,
	EntityType.StorkPrice,
	EntityType.SwapQuote,
	EntityType.TokenListCoin,
	EntityType.Transaction,
	EntityType.Session,
	EntityType.SessionSimulation,
	EntityType.TransferGraph,
	EntityType.TransferRequest,
	EntityType.UniswapPool,
	EntityType.UniswapPosition,
	EntityType.Wallet,
	EntityType.WalletConnection,
	EntityType.StateChannel,
	EntityType.StateChannelState,
	EntityType.StateChannelDeposit,
	EntityType.StateChannelTransfer,
] as const

export const entityTypes = [
	{ type: EntityType.Actor, label: 'Account', labelPlural: 'Accounts' },
	{ type: EntityType.ActorAllowance, label: 'Allowance', labelPlural: 'Allowances' },
	{ type: EntityType.ActorCoin, label: 'Token balance', labelPlural: 'Token balances' },
	{ type: EntityType.ActorNetwork, label: 'Network account', labelPlural: 'Network accounts' },
	{ type: EntityType.AgentChatTree, label: 'Agent conversation', labelPlural: 'Agent conversations' },
	{ type: EntityType.AgentChatTurn, label: 'Chat turn', labelPlural: 'Chat turns' },
	{ type: EntityType.Block, label: 'Block', labelPlural: 'Blocks' },
	{ type: EntityType.BridgeRoute, label: 'Bridge route', labelPlural: 'Bridge routes' },
	{ type: EntityType.CctpAllowance, label: 'CCTP allowance', labelPlural: 'CCTP allowances' },
	{ type: EntityType.CctpFee, label: 'CCTP fee', labelPlural: 'CCTP fees' },
	{ type: EntityType.ChannelProposal, label: 'Channel proposal', labelPlural: 'Channel proposals' },
	{ type: EntityType.Coin, label: 'Token', labelPlural: 'Tokens' },
	{ type: EntityType.ConsensusEpoch, label: 'Epoch', labelPlural: 'Epochs' },
	{ type: EntityType.Contract, label: 'Contract', labelPlural: 'Contracts' },
	{ type: EntityType.Dashboard, label: 'Dashboard', labelPlural: 'Dashboards' },
	{ type: EntityType.Caip, label: 'CAIP', labelPlural: 'CAIPs' },
	{ type: EntityType.Eip8004Service, label: 'EIP-8004 service', labelPlural: 'EIP-8004 services' },
	{ type: EntityType.NetworkFork, label: 'Network fork', labelPlural: 'Network forks' },
	{ type: EntityType.EvmError, label: 'EVM error', labelPlural: 'EVM errors' },
	{ type: EntityType.EvmSelector, label: 'EVM selector', labelPlural: 'EVM selectors' },
	{ type: EntityType.EvmTopic, label: 'EVM topic', labelPlural: 'EVM topics' },
	{ type: EntityType.Proposal, label: 'Proposal', labelPlural: 'Proposals' },
	{ type: EntityType.SocialPostSession, label: 'Social post session', labelPlural: 'Social post sessions' },
	{ type: EntityType.FarcasterCast, label: 'Cast', labelPlural: 'Casts' },
	{ type: EntityType.FarcasterChannel, label: 'Channel', labelPlural: 'Channels' },
	{ type: EntityType.FarcasterUser, label: 'Farcaster user', labelPlural: 'Farcaster users' },
	{ type: EntityType.Network, label: 'Network', labelPlural: 'Networks' },
	{ type: EntityType.Room, label: 'Room', labelPlural: 'Rooms' },
	{ type: EntityType.RoomPeer, label: 'Room peer', labelPlural: 'Room peers' },
	{ type: EntityType.SharedAddress, label: 'Shared address', labelPlural: 'Shared addresses' },
	{ type: EntityType.SiweChallenge, label: 'SIWE challenge', labelPlural: 'SIWE challenges' },
	{ type: EntityType.StorkPrice, label: 'Price feed', labelPlural: 'Price feeds' },
	{ type: EntityType.SwapQuote, label: 'Swap quote', labelPlural: 'Swap quotes' },
	{ type: EntityType.TokenListCoin, label: 'Listed token', labelPlural: 'Listed tokens' },
	{ type: EntityType.Transaction, label: 'Bridge transaction', labelPlural: 'Bridge transactions' },
	{ type: EntityType.Session, label: 'Transaction session', labelPlural: 'Transaction sessions' },
	{ type: EntityType.SessionSimulation, label: 'Session simulation', labelPlural: 'Session simulations' },
	{ type: EntityType.TransferGraph, label: 'Transfer graph', labelPlural: 'Transfer graphs' },
	{ type: EntityType.TransferRequest, label: 'Transfer request', labelPlural: 'Transfer requests' },
	{ type: EntityType.UniswapPool, label: 'Liquidity pool', labelPlural: 'Liquidity pools' },
	{ type: EntityType.UniswapPosition, label: 'Liquidity position', labelPlural: 'Liquidity positions' },
	{ type: EntityType.Wallet, label: 'Wallet', labelPlural: 'Wallets' },
	{ type: EntityType.WalletConnection, label: 'Wallet connection', labelPlural: 'Wallet connections' },
	{ type: EntityType.StateChannel, label: 'State channel', labelPlural: 'State channels' },
	{ type: EntityType.StateChannelState, label: 'Channel state', labelPlural: 'Channel states' },
	{ type: EntityType.StateChannelDeposit, label: 'Channel deposit', labelPlural: 'Channel deposits' },
	{ type: EntityType.StateChannelTransfer, label: 'Channel transfer', labelPlural: 'Channel transfers' },
] as const

type StringId = { id: string }

export type Entity<_EntityType extends EntityType = EntityType> = {
	[EntityType.Actor]: Actor
	[EntityType.ActorAllowance]: ActorAllowance
	[EntityType.ActorCoin]: ActorCoin
	[EntityType.ActorNetwork]: Record<string, unknown>
	[EntityType.AgentChatTree]: AgentChatTree
	[EntityType.AgentChatTurn]: AgentChatTurn
	[EntityType.Block]: BlockEntry
	[EntityType.BridgeRoute]: BridgeRoute
	[EntityType.CctpAllowance]: CctpAllowance
	[EntityType.CctpFee]: CctpFee
	[EntityType.ChannelProposal]: Record<string, unknown>
	[EntityType.Coin]: CoinInstanceEntry
	[EntityType.ConsensusEpoch]: { $id: { epoch: number } }
	[EntityType.Contract]: ContractEntry
	[EntityType.Dashboard]: DashboardState
	[EntityType.Eip8004Service]: Eip8004Service
	[EntityType.Caip]: CaipEntry
	[EntityType.NetworkFork]: Fork
	[EntityType.EvmError]: EvmError
	[EntityType.EvmSelector]: EvmSelector
	[EntityType.EvmTopic]: EvmTopic
	[EntityType.Proposal]: ProposalEntry
	[EntityType.SocialPostSession]: SocialPostSession
	[EntityType.FarcasterCast]: FarcasterCast
	[EntityType.FarcasterChannel]: FarcasterChannel
	[EntityType.FarcasterUser]: FarcasterUser
	[EntityType.Network]: NetworkEntry
	[EntityType.Room]: Room
	[EntityType.RoomPeer]: RoomPeer
	[EntityType.SharedAddress]: SharedAddress
	[EntityType.SiweChallenge]: SiweChallenge
	[EntityType.StorkPrice]: StorkPrice
	[EntityType.SwapQuote]: SwapQuote
	[EntityType.TokenListCoin]: TokenListCoin
	[EntityType.Transaction]: Transaction
	[EntityType.Session]: Session
	[EntityType.SessionSimulation]: SessionSimulation
	[EntityType.TransferGraph]: Record<string, unknown>
	[EntityType.TransferRequest]: TransferRequest
	[EntityType.UniswapPool]: UniswapPool
	[EntityType.UniswapPosition]: UniswapPosition
	[EntityType.Wallet]: Wallet
	[EntityType.WalletConnection]: WalletConnectionBase
	[EntityType.StateChannel]: YellowChannel
	[EntityType.StateChannelState]: YellowChannelState
	[EntityType.StateChannelDeposit]: YellowDeposit
	[EntityType.StateChannelTransfer]: YellowTransfer
}[_EntityType]

export type EntityId<_EntityType extends EntityType = EntityType> = {
	[EntityType.Actor]: Actor$Id
	[EntityType.ActorAllowance]: ActorAllowance$Id
	[EntityType.ActorCoin]: ActorCoin$Id
	[EntityType.ActorNetwork]: Record<string, unknown>
	[EntityType.AgentChatTree]: StringId
	[EntityType.AgentChatTurn]: StringId
	[EntityType.Block]: Block$Id
	[EntityType.BridgeRoute]: StringId
	[EntityType.CctpAllowance]: CctpAllowance$Id
	[EntityType.CctpFee]: CctpFee$Id
	[EntityType.ChannelProposal]: Record<string, unknown>
	[EntityType.Coin]: CoinInstance$Id
	[EntityType.ConsensusEpoch]: { epoch: number }
	[EntityType.Contract]: Contract$Id
	[EntityType.Dashboard]: DashboardState$Id
	[EntityType.Eip8004Service]: Eip8004Service$Id
	[EntityType.Caip]: CaipEntry$Id
	[EntityType.NetworkFork]: StringId
	[EntityType.EvmError]: EvmError$Id
	[EntityType.EvmSelector]: EvmSelector$Id
	[EntityType.EvmTopic]: EvmTopic$Id
	[EntityType.Proposal]: ProposalEntry$Id
	[EntityType.SocialPostSession]: StringId
	[EntityType.FarcasterCast]: FarcasterCast$Id
	[EntityType.FarcasterChannel]: FarcasterChannel$Id
	[EntityType.FarcasterUser]: FarcasterUser$Id
	[EntityType.Network]: Network$Id
	[EntityType.Room]: StringId
	[EntityType.RoomPeer]: StringId
	[EntityType.SharedAddress]: StringId
	[EntityType.SiweChallenge]: StringId
	[EntityType.StorkPrice]: StorkPrice$Id
	[EntityType.SwapQuote]: StringId
	[EntityType.TokenListCoin]: TokenListCoin$Id
	[EntityType.Transaction]: Transaction$Id
	[EntityType.Session]: StringId
	[EntityType.SessionSimulation]: StringId
	[EntityType.TransferGraph]: Record<string, unknown>
	[EntityType.TransferRequest]: StringId
	[EntityType.UniswapPool]: StringId
	[EntityType.UniswapPosition]: StringId
	[EntityType.Wallet]: Wallet$Id
	[EntityType.WalletConnection]: WalletConnection$Id
	[EntityType.StateChannel]: StringId
	[EntityType.StateChannelState]: StringId
	[EntityType.StateChannelDeposit]: StringId
	[EntityType.StateChannelTransfer]: StringId
}[_EntityType]

