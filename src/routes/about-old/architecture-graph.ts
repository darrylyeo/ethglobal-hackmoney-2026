import { ChainId, networkConfigsByChainId } from '$/constants/networks'
import { getAssetUrl } from '$lib/assets/urls'

export type ArchitectureNodeCategory =
	| 'ui'
	| 'state'
	| 'collection'
	| 'storage'
	| 'service'
	| 'external'
	| 'network'
	| 'tooling'

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

const LAYER_X = {
	client: 0,
	state: 220,
	data: 440,
	services: 700,
	infra: 960,
	networks: 1200,
}
const ROW = 68
const TOOLING_ROW_START = 12 * ROW

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
		node('dashboard-ui', LAYER_X.client, -6 * ROW, 'Dashboard UI', 'ui', {
			description: 'Panel tree + route renderer + hash history',
		}),
		node('graphscene-ui', LAYER_X.client, -4 * ROW, 'GraphScene UI', 'ui', {
			description: 'Entity graph visualization (Sigma/G6)',
		}),
		node('client-ui', LAYER_X.client, -2 * ROW, 'Client UI', 'ui', {
			routes:
				'Bridge, Swap, Liquidity, Transfers, Rooms, Wallets, Dashboard, Session, About, Test',
			components: 'Svelte 5 + Bits UI flows and execution views',
			ux: 'responsive layouts, accessibility, confirmation dialogs, loading states',
		}),
		node(
			'transfers-ui',
			LAYER_X.client,
			-ROW,
			'Transfers Visualization',
			'ui',
			{
				description: 'Threlte scene with transfer graph animation',
			},
		),
		node('visualization', LAYER_X.client, 0, 'Visualization', 'ui', {
			tools: 'G6, Sigma, Graphology, Three, Threlte',
		}),
		node('transaction-flow', LAYER_X.client, ROW, 'TransactionFlow', 'ui', {
			description: 'chain switching, simulation, confirmation gating',
		}),
		node('flow-orchestration', LAYER_X.client, 2 * ROW, 'Flow UIs', 'ui', {
			description:
				'unified bridge, CCTP, LI.FI, swap, transfer, liquidity, intents, fees/limits/slippage/confirmations',
		}),
		node('rooms-ui', LAYER_X.client, 4 * ROW, 'Rooms UI', 'ui', {
			description: 'Peer list, address sharing, channel controls',
		}),
		node('test-ui', LAYER_X.client, 6 * ROW, 'Test Routes', 'ui', {
			description: 'Collections, networks, intents, chain-id demos',
		}),
		node('wallet-state', LAYER_X.state, -4 * ROW, 'Wallet State', 'state', {
			modules: 'wallet discovery + connection state',
		}),
		node(
			'flow-settings',
			LAYER_X.state,
			-2 * ROW,
			'Flow Settings State',
			'state',
			{
				modules: 'bridge, swap, liquidity settings',
			},
		),
		node('room-state', LAYER_X.state, 0, 'Room State', 'state', {
			modules: 'PartyKit room connection + sync',
		}),
		node('yellow-state', LAYER_X.state, 2 * ROW, 'Yellow State', 'state', {
			modules: 'clearnode connection + channel sync',
		}),
		node(
			'intent-preview-state',
			LAYER_X.state,
			4 * ROW,
			'Intent Drag Preview',
			'state',
			{
				modules: 'drag/hover intent preview state',
			},
		),
		node('data-sources', LAYER_X.state, -ROW, 'Data Sources', 'state', {
			description: 'DataSource attribution for collection rows',
		}),
		node('configs', LAYER_X.state, 6 * ROW, 'Configs', 'state', {
			items:
				'networks, coins, rpc endpoints, token lists, slippage, bridge limits, cctp, yellow, schema prefs',
		}),
		node('tanstack-db', LAYER_X.state, 8 * ROW, 'TanStack DB', 'state', {
			description: 'collections, live queries, query client',
		}),
		node(
			'tx-sessions',
			LAYER_X.state,
			10 * ROW,
			'Transaction Sessions',
			'state',
			{
				description: 'session state, simulations, explain context',
			},
		),
		node('collections', LAYER_X.data, -ROW, 'Collections', 'collection', {
			modules:
				'actors, actor-allowances, actor-coins, bridge-routes, coins, cctp-allowance, cctp-fees, dashboard-panels, networks, room-peers, rooms, shared-addresses, siwe-challenges, stork-prices, swap-quotes, token-list-coins, transaction-sessions, transaction-session-simulations, transfer-events, transfer-graphs, transfer-requests, transactions, uniswap-pools, uniswap-positions, wallet-connections, wallets, yellow-channels, yellow-channel-states, yellow-deposits, yellow-transfers',
		}),
		node('graph-model', LAYER_X.data, 2 * ROW, 'Graph Model', 'collection', {
			description: 'Graphology data for visualizations',
		}),
		node('local-storage', LAYER_X.data, 0, 'localStorage', 'storage', {
			usage: 'collection persistence and cached state',
		}),
		node(
			'session-storage',
			LAYER_X.data,
			3 * ROW,
			'sessionStorage',
			'storage',
			{
				usage: 'room peer display name',
			},
		),
		node('tx-history', LAYER_X.data, 5 * ROW, 'Tx History', 'storage', {
			usage: 'local transaction history',
		}),
		node('wallets', LAYER_X.services, -5 * ROW, 'Wallets', 'service', {
			description:
				'EIP-6963 discovery, EIP-1193 providers, viem clients, chain switching',
		}),
		node(
			'dashboard-core',
			LAYER_X.services,
			-7 * ROW,
			'Dashboard Core',
			'service',
			{
				description: 'panel tree, route map, dynamic route loading',
			},
		),
		node(
			'graphscene-core',
			LAYER_X.services,
			-5.5 * ROW,
			'GraphScene Core',
			'service',
			{
				description: 'G6/Sigma graph rendering with schema-rich nodes',
			},
		),
		node('approvals', LAYER_X.services, -2 * ROW, 'Token Approval', 'service', {
			description: 'allowance checks + approval txs',
		}),
		node('voltaire', LAYER_X.services, -3 * ROW, 'Voltaire RPC', 'service', {
			description: 'eth_call, eth_getLogs, block queries, ERC20 helpers',
		}),
		node('lifi', LAYER_X.services, -ROW, 'LI.FI SDK', 'service', {
			description: 'USDC bridge routes, quotes, execution',
		}),
		node('circle', LAYER_X.services, ROW, 'Circle CCTP', 'service', {
			description:
				'fees, allowance, messages/attestations, forwarding, ABI encoding',
		}),
		node('tx-status', LAYER_X.services, 2 * ROW, 'Tx Status', 'service', {
			description: 'status mapping + explorer links',
		}),
		node('uniswap', LAYER_X.services, 3 * ROW, 'Uniswap v4', 'service', {
			description: 'swap quotes, liquidity, Universal Router execution',
		}),
		node(
			'transfers',
			LAYER_X.services,
			5 * ROW,
			'Transfers Pipeline',
			'service',
			{
				description: 'eth_getLogs (primary), Covalent indexer fallback, graphs',
			},
		),
		node('partykit', LAYER_X.services, 7 * ROW, 'PartyKit Client', 'service', {
			description: 'rooms, sync, SIWE challenges, peer messaging',
		}),
		node('siwe', LAYER_X.services, 8 * ROW, 'SIWE', 'service', {
			description: 'sign-in messages + verification',
		}),
		node('stork', LAYER_X.services, 9 * ROW, 'Stork Prices', 'service', {
			description: 'REST, WS, RPC price feeds',
		}),
		node('yellow', LAYER_X.services, 11 * ROW, 'Yellow Network', 'service', {
			description: 'clearnode auth, channels, custody ops',
		}),
		node('nitro-rpc', LAYER_X.services, 12 * ROW, 'Nitro RPC', 'service', {
			description: 'channel state encode/sign',
		}),
		node('intents', LAYER_X.services, 13 * ROW, 'Intents', 'service', {
			description: 'drag + resolve intent routes + previews + transitions',
		}),
		node('tevm-sim', LAYER_X.services, 14 * ROW, 'Tevm Simulation', 'service', {
			description: 'session simulation + traces/events',
		}),
		node('explain', LAYER_X.services, 15 * ROW, 'Explain', 'service', {
			description: 'Prompt API + hosted LLM fallback',
		}),
		node(
			'errors-retry',
			LAYER_X.services,
			17 * ROW,
			'Errors + Retry',
			'service',
			{
				description: 'error patterns + retry policies',
			},
		),
		node('toast', LAYER_X.services, 19 * ROW, 'Toasts', 'service', {
			description: 'notifications + status messages',
		}),
		node(
			'wallet-providers',
			LAYER_X.infra,
			-5 * ROW,
			'Wallet Providers',
			'external',
			{
				description: 'EIP-1193 browser wallets',
			},
		),
		node(
			'chain-explorers',
			LAYER_X.infra,
			-2 * ROW,
			'Chain Explorers',
			'external',
			{
				description: 'tx + address links per chain',
			},
		),
		node(
			'rpc-providers',
			LAYER_X.infra,
			-3 * ROW,
			'RPC Providers',
			'external',
			{
				description: 'chain JSON-RPC endpoints',
			},
		),
		node('lifi-api', LAYER_X.infra, -ROW, 'LI.FI API', 'external', {
			description: 'routes + quotes backend',
		}),
		node('circle-api', LAYER_X.infra, ROW, 'Circle CCTP API', 'external', {
			description: 'message + attestation service',
		}),
		node(
			'uniswap-router',
			LAYER_X.infra,
			3 * ROW,
			'Uniswap Router',
			'external',
			{
				description: 'onchain Universal Router',
			},
		),
		node('covalent-api', LAYER_X.infra, 5 * ROW, 'Covalent API', 'external', {
			description: 'transfer indexer',
		}),
		node(
			'partykit-server',
			LAYER_X.infra,
			7 * ROW,
			'PartyKit Server',
			'external',
			{
				description: 'realtime room server',
			},
		),
		node('stork-feeds', LAYER_X.infra, 9 * ROW, 'Stork Feeds', 'external', {
			description: 'REST/WS/RPC price feeds',
		}),
		node(
			'yellow-clearnode',
			LAYER_X.infra,
			11 * ROW,
			'Yellow Clearnode',
			'external',
			{
				description: 'Nitrolite WS relay',
			},
		),
		node(
			'yellow-custody',
			LAYER_X.infra,
			13 * ROW,
			'Yellow Custody',
			'external',
			{
				description: 'custody contract',
			},
		),
		node('prompt-api', LAYER_X.infra, 15 * ROW, 'Prompt API', 'external', {
			description: 'browser model runtime',
		}),
		node('hosted-llm', LAYER_X.infra, 17 * ROW, 'Hosted LLM', 'external', {
			description: 'LLM explain fallback endpoint',
		}),
		...NETWORK_CHAIN_IDS.map((chainId, i) =>
			node(
				`network-${chainId}`,
				LAYER_X.networks,
				(i - (NETWORK_CHAIN_IDS.length - 1) / 2) * ROW,
				networkConfigsByChainId[chainId]?.name ?? String(chainId),
				'network',
				{ chainId: String(chainId) },
				networkConfigsByChainId[chainId]?.icon ??
					`/icons/chains/${chainId}.svg`,
			),
		),
		node(
			'tooling-deno',
			LAYER_X.state,
			TOOLING_ROW_START,
			'Deno Runtime',
			'tooling',
			{
				description: 'primary runtime for tasks, scripts, tests',
			},
		),
		node(
			'tooling-node',
			LAYER_X.data,
			TOOLING_ROW_START,
			'Node Runtime',
			'tooling',
			{
				description: 'Playwright + build tooling',
			},
		),
		node(
			'tooling-vite',
			LAYER_X.services,
			TOOLING_ROW_START - ROW,
			'Vite + SvelteKit',
			'tooling',
			{
				description: 'dev server, build, preview',
			},
		),
		node(
			'tooling-checks',
			LAYER_X.services,
			TOOLING_ROW_START + ROW,
			'Typecheck + Format',
			'tooling',
			{
				description: 'svelte-check, section spacing',
			},
		),
		node(
			'tooling-tests',
			LAYER_X.services,
			TOOLING_ROW_START + 3 * ROW,
			'Unit Tests',
			'tooling',
			{
				description: 'deno test, vitest',
			},
		),
		node(
			'tooling-e2e',
			LAYER_X.services,
			TOOLING_ROW_START + 5 * ROW,
			'E2E Tests',
			'tooling',
			{
				description: 'Playwright + walletless TEVM execution',
			},
		),
		node(
			'tooling-scripts',
			LAYER_X.services,
			TOOLING_ROW_START + 7 * ROW,
			'Tooling Scripts',
			'tooling',
			{
				description:
					'chain icons, bundle size, performance checks, e2e helpers, ralph loop',
			},
		),
		node(
			'tooling-partykit',
			LAYER_X.services,
			TOOLING_ROW_START + 9 * ROW,
			'PartyKit Dev',
			'tooling',
			{
				description: 'local realtime server',
			},
		),
		node(
			'tooling-standards',
			LAYER_X.services,
			TOOLING_ROW_START + 13 * ROW,
			'UX Standards',
			'tooling',
			{
				description: 'a11y, responsive, css primitives, formatting, security',
			},
		),
		node(
			'tooling-tevm-fixtures',
			LAYER_X.services,
			TOOLING_ROW_START + 11 * ROW,
			'TEVM Fixtures',
			'tooling',
			{
				description: 'walletless execution + RPC server',
			},
		),
		node(
			'tooling-tevm',
			LAYER_X.infra,
			TOOLING_ROW_START + 5 * ROW,
			'TEVM RPC',
			'external',
			{
				description: 'walletless E2E RPC',
			},
		),
	]

	const edges: ArchitectureEdge[] = [
		edge('e-dashboard-ui-core', 'dashboard-ui', 'dashboard-core', 'panels'),
		edge(
			'e-dashboard-core-collections',
			'dashboard-core',
			'collections',
			'panels',
		),
		edge('e-graphscene-ui-core', 'graphscene-ui', 'graphscene-core', 'graph'),
		edge(
			'e-graphscene-core-model',
			'graphscene-core',
			'graph-model',
			'graph data',
		),
		edge(
			'e-graphscene-model-collections',
			'graph-model',
			'collections',
			'entities',
		),
		edge('e-graphscene-intents', 'graphscene-core', 'intents', 'drag intents'),
		edge('e-ui-wallet-state', 'client-ui', 'wallet-state', 'wallet context'),
		edge(
			'e-ui-flow-settings',
			'flow-orchestration',
			'flow-settings',
			'form state',
		),
		edge('e-ui-room-state', 'rooms-ui', 'room-state', 'room context'),
		edge('e-ui-yellow-state', 'rooms-ui', 'yellow-state', 'channel context'),
		edge(
			'e-ui-intent-preview',
			'graphscene-core',
			'intent-preview-state',
			'drag preview',
		),
		edge('e-ui-configs', 'client-ui', 'configs', 'read config'),
		edge('e-ui-db', 'client-ui', 'tanstack-db', 'live queries'),
		edge('e-ui-transfers', 'transfers-ui', 'transfers', 'graph data'),
		edge('e-ui-visuals', 'visualization', 'graphscene-core', 'renderers'),
		edge('e-ui-transaction-flow', 'transaction-flow', 'wallets', 'signing'),
		edge('e-ui-transaction-sim', 'transaction-flow', 'tevm-sim', 'simulate'),
		edge('e-ui-transaction-status', 'transaction-flow', 'tx-status', 'status'),
		edge('e-ui-approvals', 'transaction-flow', 'approvals', 'allowance'),
		edge('e-ui-flows', 'flow-orchestration', 'tanstack-db', 'flow state'),
		edge('e-ui-lifi', 'flow-orchestration', 'lifi', 'bridge routes'),
		edge('e-ui-cctp', 'flow-orchestration', 'circle', 'cctp flow'),
		edge('e-ui-uniswap', 'flow-orchestration', 'uniswap', 'swap/liquidity'),
		edge('e-rooms-ui-partykit', 'rooms-ui', 'partykit', 'realtime'),
		edge('e-rooms-ui-yellow', 'rooms-ui', 'yellow', 'channels'),
		edge('e-test-ui-intents', 'test-ui', 'intents', 'intent playground'),
		edge('e-db-collections', 'tanstack-db', 'collections', 'read/write'),
		edge('e-db-sources', 'data-sources', 'collections', 'attribution'),
		edge('e-collections-local', 'collections', 'local-storage', 'persist'),
		edge('e-collections-session', 'collections', 'session-storage', 'persist'),
		edge('e-tx-history-storage', 'tx-history', 'local-storage', 'persist'),
		edge('e-state-sessions', 'tx-sessions', 'collections', 'session rows'),
		edge('e-state-explain', 'tx-sessions', 'explain', 'explain requests'),
		edge('e-state-sim', 'tx-sessions', 'tevm-sim', 'simulation'),
		edge('e-db-wallets', 'tanstack-db', 'wallets', 'connections'),
		edge('e-db-voltaire', 'tanstack-db', 'voltaire', 'RPC/ABI'),
		edge('e-db-lifi', 'tanstack-db', 'lifi', 'routes/quotes'),
		edge('e-db-circle', 'tanstack-db', 'circle', 'CCTP'),
		edge('e-db-uniswap', 'tanstack-db', 'uniswap', 'swap quotes'),
		edge('e-db-transfers', 'tanstack-db', 'transfers', 'USDC logs'),
		edge('e-db-partykit', 'tanstack-db', 'partykit', 'rooms'),
		edge('e-db-stork', 'tanstack-db', 'stork', 'prices'),
		edge('e-db-yellow', 'tanstack-db', 'yellow', 'channels'),
		edge('e-db-intents', 'tanstack-db', 'intents', 'intent routes'),
		edge('e-db-errors', 'tanstack-db', 'errors-retry', 'error handling'),
		edge('e-ui-toast', 'client-ui', 'toast', 'notifications'),
		edge('e-ui-wallets', 'client-ui', 'wallets', 'signing', true),
		edge('e-wallets-ui', 'wallets', 'client-ui', 'chain switch', true),
		edge('e-wallets-providers', 'wallets', 'wallet-providers', 'EIP-1193'),
		edge('e-approvals-wallet', 'approvals', 'wallets', 'approve tx'),
		edge('e-approvals-rpc', 'approvals', 'voltaire', 'allowance'),
		edge('e-approvals-collections', 'approvals', 'collections', 'allowances'),
		edge('e-voltaire-rpc', 'voltaire', 'rpc-providers', 'JSON-RPC'),
		edge('e-lifi-api', 'lifi', 'lifi-api', 'SDK calls'),
		edge('e-circle-api', 'circle', 'circle-api', 'messages'),
		edge(
			'e-status-explorers',
			'tx-status',
			'chain-explorers',
			'explorer links',
		),
		edge('e-status-history', 'tx-status', 'tx-history', 'history'),
		edge('e-status-collections', 'tx-status', 'collections', 'transactions'),
		edge('e-uniswap-router', 'uniswap', 'uniswap-router', 'router txs'),
		edge('e-transfers-voltaire', 'transfers', 'voltaire', 'eth_getLogs'),
		edge('e-transfers-covalent', 'transfers', 'covalent-api', 'indexer'),
		edge('e-partykit-server', 'partykit', 'partykit-server', 'websocket'),
		edge('e-partykit-siwe', 'partykit', 'siwe', 'challenges'),
		edge('e-stork-feeds', 'stork', 'stork-feeds', 'prices'),
		edge('e-yellow-clearnode', 'yellow', 'yellow-clearnode', 'ws relay'),
		edge('e-yellow-custody', 'yellow', 'yellow-custody', 'custody txs'),
		edge('e-yellow-nitro', 'yellow', 'nitro-rpc', 'state encode'),
		edge('e-tevm-rpc', 'tevm-sim', 'rpc-providers', 'fork'),
		edge('e-intents-flow', 'intents', 'transaction-flow', 'routes'),
		edge('e-explain-prompt', 'explain', 'prompt-api', 'local model'),
		edge('e-explain-hosted', 'explain', 'hosted-llm', 'fallback'),
		edge('e-visualization-db', 'visualization', 'tanstack-db', 'graph data'),
		edge('e-tooling-deno-vite', 'tooling-deno', 'tooling-vite', 'dev/build'),
		edge(
			'e-tooling-deno-checks',
			'tooling-deno',
			'tooling-checks',
			'check/format',
		),
		edge(
			'e-tooling-standards',
			'tooling-checks',
			'tooling-standards',
			'standards',
		),
		edge('e-tooling-deno-tests', 'tooling-deno', 'tooling-tests', 'unit tests'),
		edge('e-tooling-node-e2e', 'tooling-node', 'tooling-e2e', 'playwright'),
		edge(
			'e-tooling-deno-scripts',
			'tooling-deno',
			'tooling-scripts',
			'scripts',
		),
		edge(
			'e-tooling-deno-partykit',
			'tooling-deno',
			'tooling-partykit',
			'dev server',
		),
		edge(
			'e-tooling-tevm-fixtures',
			'tooling-e2e',
			'tooling-tevm-fixtures',
			'fixtures',
		),
		edge('e-tooling-tevm-rpc', 'tooling-tevm-fixtures', 'tooling-tevm', 'rpc'),
		edge('e-e2e-tevm', 'tooling-e2e', 'tooling-tevm', 'rpc'),
		edge('e-e2e-wallets', 'tooling-e2e', 'wallets', 'test provider'),
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
			edge(
				`e-uniswap-net-${chainId}`,
				'uniswap',
				`network-${chainId}`,
				'swap tx',
			),
			edge(
				`e-yellow-net-${chainId}`,
				'yellow',
				`network-${chainId}`,
				'channels',
			),
		]),
	]

	return { nodes, edges }
}
