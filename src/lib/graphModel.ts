import type Graph from 'graphology'
import type { EntityType } from '$/data/$EntityType.ts'
import type { IntentDragPayload } from '$/constants/intents.ts'

export type GraphNodeStyle = Record<string, unknown>
export type GraphEdgeStyle = Record<string, unknown>

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
	intent?: IntentDragPayload
	disabled?: boolean
	g6Type?: string
	g6Style?: GraphNodeStyle
}

export type GraphEdge = {
	id: string
	source: string
	target: string
	size?: number
	color?: string
	type?: string
	relation?: string
	g6Style?: GraphEdgeStyle
	disabled?: boolean
}

export type GraphModel = {
	graph: Graph
	nodes: GraphNode[]
	edges: GraphEdge[]
}

export enum GraphFramework {
	Sigma = 'sigma',
	G6 = 'g6',
}
