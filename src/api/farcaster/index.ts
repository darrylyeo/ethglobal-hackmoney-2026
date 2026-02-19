/**
 * Farcaster API: Client (protocol) + Hub (protocol) + Neynar (provider-specific).
 */

export type { Channel } from './client.ts'
export { fetchAllChannels, fetchChannel } from './client.ts'

export {
	fetchCastById,
	fetchCastsByFid,
	fetchCastsByMention,
	fetchCastsByParent,
	fetchLinksByFid,
	fetchLinksByTargetFid,
	fetchOnChainIdRegistryEventByAddress,
	fetchReactionsByCast,
	fetchUserDataByFid,
	fetchUsernameProofsByFid,
	fetchVerificationsByFid,
	getFidByAddress,
	isFullHash,
	isTruncatedHash,
	LINK_TYPE_FOLLOW,
	REACTION_TYPE_LIKE,
	REACTION_TYPE_RECAST,
	resolveCastByTruncatedHash,
} from './hub.ts'
export type {
	CastMessage,
	LinkMessage,
	OnChainIdRegistryEvent,
	ReactionMessage,
	UserDataMessage,
	VerificationMessage,
} from './hub.ts'

export { fetchCastByHash } from './neynar.ts'
export { publishCast, type PublishCastParams, type PublishCastResult } from './publish.ts'
