/**
 * Normalized model for the architecture diagram. Nodes and edges describe
 * the app’s major systems and data flows for the G6-powered diagram.
 */

import { networkConfigsByChainId } from '$/constants/networks'

export type ArchitectureNodeCategory = 'ui' | 'state' | 'service' | 'network'

export type ArchitectureNode = {
	id: string
	x: number
	y: number
	label: string
	category: ArchitectureNodeCategory
	details?: Record<string, string>
	image?: string
}

export type ArchitectureEdge = {
	id: string
	source: string
	target: string
	label: string
	critical?: boolean
}

export type ArchitectureGraphModel = {
	nodes: ArchitectureNode[]
	edges: ArchitectureEdge[]
}

const LAYER_X = { client: 0, state: 180, services: 420, networks: 720 }
const ROW = 80

function node(
	id: string,
	x: number,
	y: number,
	label: string,
	category: ArchitectureNodeCategory,
	details?: Record<string, string>,
	image?: string,
): ArchitectureNode {
	return { id, x, y, label, category, details, image }
}

function edge(id: string, source: string, target: string, label: string, critical?: boolean): ArchitectureEdge {
	return { id, source, target, label, critical }
}

const CHAIN_IDS_FOR_DIAGRAM: readonly number[] = [137, 42161, 8453, 11155111, 324]

export function getArchitectureGraphModel(): ArchitectureGraphModel {
	const nodes: ArchitectureNode[] = [
		node('client-ui', LAYER_X.client, 0, 'Client/UI', 'ui', {
			description: 'SvelteKit app + Svelte 5 components',
		}),
		node('state', LAYER_X.state, 0, 'State', 'state', {
			description: 'TanStack DB collections',
		}),
		node('voltaire', LAYER_X.services, -3 * ROW, 'Blockchain', 'service', {
			description: 'Voltaire RPC + ABI registry',
		}),
		node('lifi', LAYER_X.services, -2 * ROW, 'Bridge/Swap', 'service', {
			description: 'LI.FI routes + quotes',
		}),
		node('circle', LAYER_X.services, -ROW, 'USDC bridge', 'service', {
			description: 'Circle CCTP / Bridge Kit',
		}),
		node('partykit', LAYER_X.services, 0, 'Rooms', 'service', {
			description: 'PartyKit realtime rooms',
		}),
		node('stork', LAYER_X.services, ROW, 'Price/Oracle', 'service', {
			description: 'Stork price feeds',
		}),
		node('yellow', LAYER_X.services, 2 * ROW, 'Payments', 'service', {
			description: 'Yellow state channels',
		}),
		node('wallets', LAYER_X.services, 3 * ROW, 'Wallets', 'service', {
			description: 'EIP-1193 wallet connections',
		}),
		...CHAIN_IDS_FOR_DIAGRAM.map((chainId, i) =>
			node(
				`network-${chainId}`,
				LAYER_X.networks,
				(i - (CHAIN_IDS_FOR_DIAGRAM.length - 1) / 2) * ROW,
				networkConfigsByChainId[chainId]?.name ?? String(chainId),
				'network',
				{ chainId: String(chainId) },
				`/networks/${chainId}.svg`,
			),
		),
	]

	const edges: ArchitectureEdge[] = [
		edge('e-ui-state', 'client-ui', 'state', 'collections'),
		edge('e-state-voltaire', 'state', 'voltaire', 'RPC'),
		edge('e-state-lifi', 'state', 'lifi', 'quotes'),
		edge('e-state-circle', 'state', 'circle', 'CCTP'),
		edge('e-state-stork', 'state', 'stork', 'prices'),
		edge('e-state-yellow', 'state', 'yellow', 'channel state'),
		edge('e-ui-wallets', 'client-ui', 'wallets', 'signing', true),
		edge('e-wallets-ui', 'wallets', 'client-ui', 'chain switch', true),
		edge('e-partykit-ui', 'partykit', 'client-ui', 'realtime'),
		edge('e-ui-partykit', 'client-ui', 'partykit', 'realtime'),
		...CHAIN_IDS_FOR_DIAGRAM.flatMap((chainId) => [
			edge(`e-voltaire-net-${chainId}`, 'voltaire', `network-${chainId}`, 'RPC'),
			edge(`e-wallets-net-${chainId}`, 'wallets', `network-${chainId}`, 'tx', true),
		]),
	]

	return { nodes, edges }
}
