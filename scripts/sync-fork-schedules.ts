/**
 * Sync script for fork schedules: fetches from pinned GitHub URLs (Geth params/config.go
 * and consensus-specs mainnet.yaml), normalizes to schedules.json + manifest.json.
 * No git submodules. Run: deno task forks:sync
 */

const GETH_REF = 'v1.14.3'
const GETH_CONFIG_URL = `https://raw.githubusercontent.com/ethereum/go-ethereum/${GETH_REF}/params/config.go`
const CONSENSUS_REF = 'v1.6.0'
const CONSENSUS_MAINNET_URL = `https://raw.githubusercontent.com/ethereum/consensus-specs/${CONSENSUS_REF}/configs/mainnet.yaml`
const OUT_DIR = new URL('../src/data/fork-schedules/', import.meta.url).pathname

type ForkActivation = { name: string; activation: { block?: number; timestamp?: number; epoch?: number }; forkHash?: string; kind?: 'execution' | 'consensus' | 'blob' }
type ChainForkSchedule = { chainId: number; forks: ForkActivation[] }
type Schedules = { chains: Record<string, ChainForkSchedule> }
type Manifest = { sources: Record<string, { ref: string; url: string }>; lastSynced?: string }

const CHAIN_CONFIG_NAMES: { name: string; chainId: number }[] = [
	{ name: 'Mainnet', chainId: 1 },
	{ name: 'Sepolia', chainId: 11155111 },
	{ name: 'Holesky', chainId: 17000 },
]

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
		if (kind === 'Block') forks.push({ name, activation: { block: num } })
		else forks.push({ name, activation: { timestamp: num } })
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
	while ((m = epochRe.exec(yaml)) !== null)
		forks.push({ name: m[1].replace(/_/g, ' '), activation: { epoch: parseInt(m[2], 10) }, kind: 'consensus' })
	return forks.sort((a, b) => (a.activation.epoch ?? 0) - (b.activation.epoch ?? 0))
}

async function main() {
	const [goContent] = await Promise.all([fetchGethConfig(), fetchConsensusMainnet()]) // both fetched for manifest
	const chains: Record<string, ChainForkSchedule> = {}
	for (const { name, chainId } of CHAIN_CONFIG_NAMES) {
		const forks = extractChainConfigForks(goContent, name)
		if (forks.length > 0) chains[String(chainId)] = { chainId, forks }
	}
	const schedules: Schedules = { chains }
	const manifest: Manifest = {
		sources: {
			geth: { ref: GETH_REF, url: GETH_CONFIG_URL },
			'consensus-specs': { ref: CONSENSUS_REF, url: CONSENSUS_MAINNET_URL },
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
