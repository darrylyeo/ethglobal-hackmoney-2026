/**
 * Persisted graph scene UI state: framework, visible entity types, hidden entity sources.
 */

import type { GraphFramework } from '$/lib/graphModel.ts'
import { EntityType } from '$/data/$EntityType.ts'
import { PersistedState } from 'runed'

export type GraphScenePersisted = {
	graphFramework: GraphFramework
	visibleEntities: string[]
	hiddenEntitySources: string[]
}

export const defaultVisibleEntityTypes: EntityType[] = [
	EntityType.Actor,
	EntityType.ActorCoin,
	EntityType.ActorAllowance,
	EntityType.Room,
	EntityType.RoomPeer,
	EntityType.SharedAddress,
	EntityType.TransactionSession,
	EntityType.TransferRequest,
	EntityType.Network,
	EntityType.Coin,
	EntityType.StorkPrice,
	EntityType.TransactionSessionSimulation,
]

const defaultValue: GraphScenePersisted = {
	graphFramework: 'g6',
	visibleEntities: [...defaultVisibleEntityTypes],
	hiddenEntitySources: [],
}

export const graphSceneState = new PersistedState<GraphScenePersisted>(
	'graph-scene',
	defaultValue,
)
