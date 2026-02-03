import type {
	EntityType as _EntityType,
	GRAPH_SCENE_ENTITY_TYPES,
} from '../../data/$EntityType.ts'

export type EntityType = (typeof _EntityType)[keyof typeof _EntityType]
export type GraphSceneEntityType = (typeof GRAPH_SCENE_ENTITY_TYPES)[number]
