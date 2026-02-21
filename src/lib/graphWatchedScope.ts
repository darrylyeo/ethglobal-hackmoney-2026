/**
 * Graph watched-scope filtering: maps entity rows to watched-entity keys and checks
 * if a row is in the watched set (default scope) or expanded (full collection).
 */

import { watchedEntityKey } from '$/collections/WatchedEntities.ts'
import { EntityType } from '$/data/$EntityType.ts'
import type { WatchedEntityStoredRow } from '$/collections/WatchedEntities.ts'

export type WatchedKeysByType = Map<EntityType, Set<string>>

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null

const toKey = (entityType: EntityType, entityId: unknown) =>
	watchedEntityKey({
		entityType,
		entityId:
			typeof entityId === 'string' ? entityId : (entityId as object),
	})

export function buildWatchedKeys(
	watchedRows: { row: WatchedEntityStoredRow }[],
	recentTxHashes?: string[],
): WatchedKeysByType {
	const byType = new Map<EntityType, Set<string>>()
	for (const { row } of watchedRows) {
		const key = watchedEntityKey(row)
		const set = byType.get(row.entityType) ?? new Set()
		set.add(key)
		byType.set(row.entityType, set)
	}
	if (recentTxHashes?.length) {
		const set = byType.get(EntityType.Transaction) ?? new Set()
		for (const hash of recentTxHashes)
			set.add(toKey(EntityType.Transaction, { sourceTxHash: hash }))
		byType.set(EntityType.Transaction, set)
	}
	return byType
}

function rowToWatchedKey(
	entityType: EntityType,
	row: Record<string, unknown>,
): string | null {
	const $id = row.$id
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
		const id = row.id ?? idRec.id
		return typeof id === 'string' ? toKey(entityType, { id }) : null
	}
	if (entityType === EntityType.Network) {
		const chainId = idRec.chainId
		return typeof chainId === 'number' ? toKey(entityType, { chainId }) : null
	}
	if (entityType === EntityType.Transaction) {
		const sourceTxHash = idRec.sourceTxHash ?? row.sourceTxHash
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
	return null
}

function actorIdFromRow(row: Record<string, unknown>): unknown {
	const $id = row.$id
	if (!isRecord($id)) return null
	if ('$actor' in $id && isRecord($id.$actor)) return $id.$actor
	if ('$actorCoin' in $id && isRecord($id.$actorCoin)) {
		const ac = $id.$actorCoin as Record<string, unknown>
		return isRecord(ac.$actor) ? ac.$actor : null
	}
	if ('$network' in $id && 'address' in $id) return $id
	return null
}

export function isRowInWatchedScope(
	entityType: EntityType,
	row: Record<string, unknown>,
	watchedKeys: WatchedKeysByType,
): boolean {
	const rowKey = rowToWatchedKey(entityType, row)
	if (rowKey && watchedKeys.get(entityType)?.has(rowKey)) return true
	if (
		entityType === EntityType.ActorCoin ||
		entityType === EntityType.ActorAllowance
	) {
		const actorId = actorIdFromRow(row)
		if (actorId != null) {
			const key = toKey(EntityType.Actor, actorId)
			if (watchedKeys.get(EntityType.Actor)?.has(key)) return true
		}
	}
	if (
		entityType === EntityType.RoomPeer ||
		entityType === EntityType.SharedAddress ||
		entityType === EntityType.SiweChallenge ||
		entityType === EntityType.TransferRequest
	) {
		const roomId =
			row.roomId ??
			(isRecord(row.$id)
				? (row.$id as Record<string, unknown>).roomId
				: undefined)
		if (
			typeof roomId === 'string' &&
			watchedKeys.get(EntityType.Room)?.has(toKey(EntityType.Room, { id: roomId }))
		)
			return true
	}
	if (entityType === EntityType.SessionSimulation) {
		const sessionId = row.sessionId
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
