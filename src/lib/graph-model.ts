import type Graph from 'graphology'
import type { EntityType } from '$/constants/entity-types'

export type GraphNode = {
	id: string
	x: number
	y: number
	size?: number
	color?: string
	label?: string
	type?: string
	image?: string
	collection: EntityType
	details?: Record<string, unknown>
}

export type GraphEdge = {
	id: string
	source: string
	target: string
	size?: number
	color?: string
	type?: string
	relation?: string
}

export type GraphModel = {
	graph: Graph
	nodes: GraphNode[]
	edges: GraphEdge[]
}

export type GraphFramework =
	| 'sigma'
	| 'g6'
