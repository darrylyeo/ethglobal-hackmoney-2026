/**
 * Persisted graph scene UI state: framework, visible entity types, hidden entity sources.
 */

import { GraphFramework } from '$/lib/graphModel.ts'
import { EntityType } from '$/data/$EntityType.ts'
import { PersistedState } from 'runed'

export type GraphScenePersisted = {
	graphFramework: GraphFramework
	isVisible?: boolean
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
	EntityType.Session,
	EntityType.TransferRequest,
	EntityType.Network,
	EntityType.Coin,
	EntityType.StorkPrice,
	EntityType.SessionSimulation,
]

const defaultValue: GraphScenePersisted = {
	graphFramework: GraphFramework.G6,
	isOpen: false,
	visibleEntities: [...defaultVisibleEntityTypes],
	hiddenEntitySources: [],
}

export const graphSceneState = new PersistedState<GraphScenePersisted>(
	'graph-scene',
	defaultValue,
)
