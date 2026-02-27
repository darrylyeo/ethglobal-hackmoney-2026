/**
 * Graph watched-scope filtering: maps entity rows to watched-entity keys and checks
 * if a row is in the watched set (default scope) or expanded (full collection).
 */

import type { WatchedEntityStored } from '$/collections/WatchedEntities.ts'
import { EntityType } from '$/data/$EntityType.ts'
import { entityKey } from '$/lib/entity-key.ts'

export type WatchedKeysByType = Map<EntityType, Set<string>>

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null

const toKey = (entityType: EntityType, entityId: unknown) =>
	entityKey({
		entityType,
		entityId:
			typeof entityId === 'string' ? entityId : (entityId as object),
	})

export function buildWatchedKeys(
	watched: { row: WatchedEntityStored }[],
	recentTxHashes?: string[],
): WatchedKeysByType {
	const byType = new Map<EntityType, Set<string>>()
	for (const { row: item } of watched) {
		const key = entityKey(item)
		const set = byType.get(item.entityType) ?? new Set()
		set.add(key)
		byType.set(item.entityType, set)
	}
	if (recentTxHashes?.length) {
		const set = byType.get(EntityType.Transaction) ?? new Set()
		for (const hash of recentTxHashes)
			set.add(toKey(EntityType.Transaction, { sourceTxHash: hash }))
		byType.set(EntityType.Transaction, set)
	}
	return byType
}

function entityToWatchedKey(
	entityType: EntityType,
	item: Record<string, unknown>,
): string | null {
	const $id = item.$id
	if ($id == null) return null
	const idRec = isRecord($id) ? $id : null
	if (!idRec) return null

	if (
		entityType === EntityType.Actor ||
		entityType === EntityType.Coin ||
		entityType === EntityType.Contract ||
		entityType === EntityType.Block ||
		entityType === EntityType.FarcasterUser ||
		entityType === EntityType.FarcasterChannel ||
		entityType === EntityType.FarcasterCast
	)
		return toKey(entityType, $id)
	if (
		entityType === EntityType.Session ||
		entityType === EntityType.Room ||
		entityType === EntityType.AgentChatTree ||
		entityType === EntityType.SocialPostSession ||
		entityType === EntityType.TransferRequest
	) {
		const id = item.id ?? idRec.id
		return typeof id === 'string' ? toKey(entityType, { id }) : null
	}
	if (entityType === EntityType.Network) {
		const chainId = idRec.chainId
		return typeof chainId === 'number' ? toKey(entityType, { chainId }) : null
	}
	if (entityType === EntityType.Transaction) {
		const sourceTxHash = idRec.sourceTxHash ?? item.sourceTxHash
		return typeof sourceTxHash === 'string'
			? toKey(entityType, { sourceTxHash })
			: null
	}
	if (entityType === EntityType.Wallet) {
		const rdns = idRec.rdns
		return typeof rdns === 'string' ? toKey(entityType, { rdns }) : null
	}
	if (entityType === EntityType.WalletConnection)
		return toKey(entityType, { wallet$id: idRec.wallet$id })
	if (entityType === EntityType.Eip8004Service) {
		const chainId = idRec.chainId
		const identityId = idRec.identityId
		return typeof chainId === 'number' && typeof identityId === 'string'
			? toKey(entityType, { chainId, identityId })
			: null
	}
	return null
}

function actorIdFrom(item: Record<string, unknown>): unknown {
	const $id = item.$id
	if (!isRecord($id)) return null
	if ('$actor' in $id && isRecord($id.$actor)) return $id.$actor
	if ('$actorCoin' in $id && isRecord($id.$actorCoin)) {
		const ac = $id.$actorCoin as Record<string, unknown>
		return isRecord(ac.$actor) ? ac.$actor : null
	}
	if ('$network' in $id && 'address' in $id) return $id
	return null
}

export function isInWatchedScope(
	entityType: EntityType,
	item: Record<string, unknown>,
	watchedKeys: WatchedKeysByType,
): boolean {
	const key = entityToWatchedKey(entityType, item)
	if (key && watchedKeys.get(entityType)?.has(key)) return true
	if (
		entityType === EntityType.ActorCoin ||
		entityType === EntityType.ActorAllowance
	) {
		const actorId = actorIdFrom(item)
		if (actorId != null) {
			const actorKey = toKey(EntityType.Actor, actorId)
			if (watchedKeys.get(EntityType.Actor)?.has(actorKey)) return true
		}
	}
	if (
		entityType === EntityType.RoomPeer ||
		entityType === EntityType.SharedAddress ||
		entityType === EntityType.SiweChallenge ||
		entityType === EntityType.TransferRequest
	) {
		const roomId =
			item.roomId ??
			(isRecord(item.$id)
				? (item.$id as Record<string, unknown>).roomId
				: undefined)
		if (
			typeof roomId === 'string' &&
			watchedKeys.get(EntityType.Room)?.has(toKey(EntityType.Room, { id: roomId }))
		)
			return true
	}
	if (entityType === EntityType.SessionSimulation) {
		const sessionId = item.sessionId
		if (
			typeof sessionId === 'string' &&
			watchedKeys.get(EntityType.Session)?.has(
				toKey(EntityType.Session, { id: sessionId }),
			)
		)
			return true
	}
	return false
}
