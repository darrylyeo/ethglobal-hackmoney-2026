import { ChainId, networkConfigsByChainId } from '$/constants/networks'

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

const LAYER_X = { client: 0, state: 200, services: 440, networks: 740 }
const ROW = 80

const NETWORK_CHAIN_IDS: readonly ChainId[] = [
	ChainId.Ethereum,
	ChainId.Arbitrum,
	ChainId.Base,
	ChainId.Optimism,
	ChainId.Polygon,
	ChainId.ZkSyncEra,
]

const node = (
	id: string,
	x: number,
	y: number,
	label: string,
	category: ArchitectureNodeCategory,
	details?: Record<string, string>,
	image?: string,
): ArchitectureNode => ({ id, x, y, label, category, details, image })

const edge = (
	id: string,
	source: string,
	target: string,
	label: string,
	critical?: boolean,
): ArchitectureEdge => ({ id, source, target, label, critical })

export const getArchitectureGraphModel = (): ArchitectureGraphModel => {
	const nodes: ArchitectureNode[] = [
		node('client-ui', LAYER_X.client, 0, 'Client UI', 'ui', {
			description: 'SvelteKit routes (Bridge, Swap, Transfers, Rooms, Graph)',
		}),
		node('state', LAYER_X.state, 0, 'State', 'state', {
			description: 'TanStack DB collections + live queries',
		}),
		node('voltaire', LAYER_X.services, -4 * ROW, 'Voltaire', 'service', {
			description: 'RPC + ABI registry (tevm)',
		}),
		node('transfers', LAYER_X.services, -3 * ROW, 'Transfers data', 'service', {
			description: 'Voltaire logs (primary) + Covalent indexer fallback',
		}),
		node('lifi', LAYER_X.services, -2 * ROW, 'LI.FI', 'service', {
			description: 'Bridge + swap routes/quotes',
		}),
		node('circle', LAYER_X.services, -ROW, 'Circle CCTP', 'service', {
			description: 'USDC bridge kit',
		}),
		node('uniswap', LAYER_X.services, 0, 'Uniswap v4', 'service', {
			description: 'Swap + liquidity via Universal Router',
		}),
		node('partykit', LAYER_X.services, ROW, 'PartyKit', 'service', {
			description: 'Realtime rooms + presence',
		}),
		node('stork', LAYER_X.services, 2 * ROW, 'Stork', 'service', {
			description: 'Price feeds + tokens',
		}),
		node('yellow', LAYER_X.services, 3 * ROW, 'Yellow', 'service', {
			description: 'State channels + escrow',
		}),
		node('wallets', LAYER_X.services, 4 * ROW, 'Wallets', 'service', {
			description: 'EIP-1193 providers + signing',
		}),
		...NETWORK_CHAIN_IDS.map((chainId, i) =>
			node(
				`network-${chainId}`,
				LAYER_X.networks,
				(i - (NETWORK_CHAIN_IDS.length - 1) / 2) * ROW,
				networkConfigsByChainId[chainId]?.name ?? String(chainId),
				'network',
				{ chainId: String(chainId) },
				networkConfigsByChainId[chainId]?.icon ?? `/networks/${chainId}.svg`,
			),
		),
	]

	const edges: ArchitectureEdge[] = [
		edge('e-ui-state', 'client-ui', 'state', 'collections'),
		edge('e-state-voltaire', 'state', 'voltaire', 'RPC/ABI'),
		edge('e-state-transfers', 'state', 'transfers', 'USDC logs'),
		edge('e-state-lifi', 'state', 'lifi', 'routes/quotes'),
		edge('e-state-circle', 'state', 'circle', 'CCTP'),
		edge('e-state-uniswap', 'state', 'uniswap', 'swap quotes'),
		edge('e-state-stork', 'state', 'stork', 'prices'),
		edge('e-state-yellow', 'state', 'yellow', 'channels'),
		edge('e-ui-wallets', 'client-ui', 'wallets', 'signing', true),
		edge('e-wallets-ui', 'wallets', 'client-ui', 'chain switch', true),
		edge('e-ui-partykit', 'client-ui', 'partykit', 'realtime'),
		edge('e-partykit-ui', 'partykit', 'client-ui', 'realtime'),
		edge('e-transfers-voltaire', 'transfers', 'voltaire', 'RPC'),
		...NETWORK_CHAIN_IDS.flatMap((chainId) => [
			edge(
				`e-voltaire-net-${chainId}`,
				'voltaire',
				`network-${chainId}`,
				'RPC',
			),
			edge(
				`e-wallets-net-${chainId}`,
				'wallets',
				`network-${chainId}`,
				'tx',
				true,
			),
		]),
	]

	return { nodes, edges }
}
