/**
 * Sync script for fork schedules: fetches from pinned GitHub URLs (Geth params/config.go,
 * consensus-specs mainnet.yaml, superchain-registry superchain.toml), normalizes to
 * schedules.json + manifest.json. Run: deno task forks:sync
 */

const GETH_REF = 'v1.14.3'
const GETH_CONFIG_URL = `https://raw.githubusercontent.com/ethereum/go-ethereum/${GETH_REF}/params/config.go`
const CONSENSUS_REF = 'v1.6.0'
const CONSENSUS_MAINNET_URL = `https://raw.githubusercontent.com/ethereum/consensus-specs/${CONSENSUS_REF}/configs/mainnet.yaml`
const SUPERCHAIN_REF = 'main'
const SUPERCHAIN_MAINNET_URL = `https://raw.githubusercontent.com/ethereum-optimism/superchain-registry/${SUPERCHAIN_REF}/superchain/configs/mainnet/superchain.toml`
const SUPERCHAIN_SEPOLIA_URL = `https://raw.githubusercontent.com/ethereum-optimism/superchain-registry/${SUPERCHAIN_REF}/superchain/configs/sepolia/superchain.toml`
const OUT_DIR = new URL('../src/data/fork-schedules/', import.meta.url).pathname

const DISABLED_EPOCH = 18446744073709551615

type ForkActivation = {
	name: string
	activation: { block?: number; timestamp?: number; epoch?: number }
	forkHash?: string
	kind?: 'execution' | 'consensus' | 'blob'
	executionProtocol?: string
	consensusProtocol?: string
}
type ChainForkSchedule = { chainId: number; forks: ForkActivation[] }
type Schedules = { chains: Record<string, ChainForkSchedule> }
type Manifest = { sources: Record<string, { ref: string; url: string }>; lastSynced?: string }

const CHAIN_CONFIG_NAMES: { name: string; chainId: number }[] = [
	{ name: 'Mainnet', chainId: 1 },
	{ name: 'Sepolia', chainId: 11155111 },
	{ name: 'Holesky', chainId: 17000 },
]

const OP_MAINNET_CHAIN_IDS = [10, 8453]
const OP_SEPOLIA_CHAIN_IDS = [11155420, 84532]
const BEDROCK_MAINNET_TIME = 1686079703

function extractChainConfigForks(goContent: string, configName: string): ForkActivation[] {
	const start = goContent.indexOf(`${configName}ChainConfig = &ChainConfig{`)
	if (start < 0) return []
	const after = start + `${configName}ChainConfig = &ChainConfig{`.length
	const nextConfig = goContent.indexOf('ChainConfig = &ChainConfig{', after)
	const end = nextConfig > 0 ? nextConfig : after + 4000
	const slice = goContent.slice(start, end)
	const forkRe = /(\w+)(Block|Time):\s*(?:big\.NewInt|newUint64)\(([\d_]+)\)/g
	const forks: ForkActivation[] = []
	let m: RegExpExecArray | null
	while ((m = forkRe.exec(slice)) !== null) {
		const [, name, kind, val] = m
		const num = parseInt(val.replace(/_/g, ''), 10)
		if (kind === 'Block')
			forks.push({ name, activation: { block: num }, executionProtocol: 'Ethereum' })
		else
			forks.push({ name, activation: { timestamp: num }, executionProtocol: 'Ethereum' })
	}
	return forks.sort((a, b) => {
		const va = a.activation.block ?? a.activation.timestamp ?? 0
		const vb = b.activation.block ?? b.activation.timestamp ?? 0
		return va - vb
	})
}

async function fetchGethConfig(): Promise<string> {
	const r = await fetch(GETH_CONFIG_URL)
	if (!r.ok) throw new Error(`Geth config fetch failed: ${r.status} ${GETH_CONFIG_URL}`)
	return r.text()
}

async function fetchConsensusMainnet(): Promise<string> {
	const r = await fetch(CONSENSUS_MAINNET_URL)
	if (!r.ok) throw new Error(`Consensus mainnet fetch failed: ${r.status} ${CONSENSUS_MAINNET_URL}`)
	return r.text()
}

function parseConsensusMainnetYaml(yaml: string): ForkActivation[] {
	const forks: ForkActivation[] = []
	const epochRe = /^([A-Z][A-Za-z_]+)_FORK_EPOCH:\s*(\d+)/gm
	let m: RegExpExecArray | null
	while ((m = epochRe.exec(yaml)) !== null) {
		const epoch = parseInt(m[2], 10)
		if (epoch === DISABLED_EPOCH) continue
		const name = m[1]
			.split('_')
			.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
			.join(' ')
		forks.push({
			name,
			activation: { epoch },
			kind: 'consensus',
			consensusProtocol: 'EthereumBeacon',
		})
	}
	return forks.sort((a, b) => (a.activation.epoch ?? 0) - (b.activation.epoch ?? 0))
}

async function fetchSuperchainToml(url: string): Promise<string> {
	const r = await fetch(url)
	if (!r.ok) throw new Error(`Superchain fetch failed: ${r.status} ${url}`)
	return r.text()
}

function parseSuperchainHardforks(toml: string): ForkActivation[] {
	const start = toml.indexOf('[hardforks]')
	if (start < 0) return []
	const slice = toml.slice(start)
	const lineRe = /^\s*(\w+_time)\s*=\s*(\d+)/gm
	const forks: ForkActivation[] = []
	let m: RegExpExecArray | null
	while ((m = lineRe.exec(slice)) !== null) {
		const [, key, val] = m
		const timestamp = parseInt(val, 10)
		const name = key
			.replace(/_time$/, '')
			.split('_')
			.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
			.join(' ')
		forks.push({
			name,
			activation: { timestamp },
			kind: 'execution',
			executionProtocol: 'OpStack',
		})
	}
	return forks.sort((a, b) => (a.activation.timestamp ?? 0) - (b.activation.timestamp ?? 0))
}

async function main() {
	const [goContent, consensusYaml, superchainMainnetToml, superchainSepoliaToml] = await Promise.all([
		fetchGethConfig(),
		fetchConsensusMainnet(),
		fetchSuperchainToml(SUPERCHAIN_MAINNET_URL),
		fetchSuperchainToml(SUPERCHAIN_SEPOLIA_URL),
	])
	const chains: Record<string, ChainForkSchedule> = {}
	for (const { name, chainId } of CHAIN_CONFIG_NAMES) {
		const forks = extractChainConfigForks(goContent, name)
		if (forks.length > 0) chains[String(chainId)] = { chainId, forks }
	}
	const clForks = parseConsensusMainnetYaml(consensusYaml)
	if (clForks.length > 0 && chains['1']) {
		chains['1'].forks = [...chains['1'].forks, ...clForks]
	}
	const opMainnetForks = [
		{
			name: 'Bedrock',
			activation: { timestamp: BEDROCK_MAINNET_TIME },
			kind: 'execution' as const,
			executionProtocol: 'OpStack',
		},
		...parseSuperchainHardforks(superchainMainnetToml),
	]
	const opSepoliaForks = parseSuperchainHardforks(superchainSepoliaToml)
	for (const chainId of OP_MAINNET_CHAIN_IDS)
		chains[String(chainId)] = { chainId, forks: opMainnetForks }
	for (const chainId of OP_SEPOLIA_CHAIN_IDS)
		chains[String(chainId)] = { chainId, forks: opSepoliaForks }
	const schedules: Schedules = { chains }
	const manifest: Manifest = {
		sources: {
			geth: { ref: GETH_REF, url: GETH_CONFIG_URL },
			'consensus-specs': { ref: CONSENSUS_REF, url: CONSENSUS_MAINNET_URL },
			'superchain-registry': { ref: SUPERCHAIN_REF, url: SUPERCHAIN_MAINNET_URL },
		},
		lastSynced: new Date().toISOString(),
	}
	await Deno.mkdir(OUT_DIR, { recursive: true })
	const schedulesPath = `${OUT_DIR}schedules.json`
	const manifestPath = `${OUT_DIR}manifest.json`
	await Deno.writeTextFile(schedulesPath, JSON.stringify(schedules, null, 2) + '\n')
	await Deno.writeTextFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
	console.log('Wrote', schedulesPath, manifestPath)
}

main().catch((e) => {
	console.error(e)
	Deno.exit(1)
})
