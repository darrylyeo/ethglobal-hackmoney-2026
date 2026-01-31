/**
 * Network status: RPC health per chain and LI.FI API. Used by NetworkStatusIndicator
 * and bridge page for degraded/down chain warnings.
 */
import { rpcUrls } from '$/constants/rpc-endpoints'
import { createHttpProvider } from '$/lib/voltaire'

export type ChainStatus = {
	chainId: number
	status: 'healthy' | 'degraded' | 'down'
	latencyMs: number | null
	lastChecked: number
	error?: string
}

export type NetworkStatus = {
	chains: Map<number, ChainStatus>
	lifiApi: 'healthy' | 'degraded' | 'down'
	overall: 'healthy' | 'degraded' | 'down'
	lastUpdated: number
}

const CHECK_INTERVAL = 30_000
const LATENCY_THRESHOLD_DEGRADED = 2000
const LATENCY_THRESHOLD_DOWN = 10_000

const createNetworkStatusStore = () => {
	let status = $state<NetworkStatus>({
		chains: new Map(),
		lifiApi: 'healthy',
		overall: 'healthy',
		lastUpdated: 0,
	})

	let checkInterval: ReturnType<typeof setInterval> | null = null

	const checkChain = async (chainId: number): Promise<ChainStatus> => {
		const rpcUrl = rpcUrls[chainId]
		if (!rpcUrl) {
			return {
				chainId,
				status: 'down',
				latencyMs: null,
				lastChecked: Date.now(),
				error: 'No RPC URL configured',
			}
		}

		const start = performance.now()
		try {
			const provider = createHttpProvider(rpcUrl)
			const timeoutPromise = new Promise<never>((_, rej) =>
				setTimeout(() => rej(new Error('Timeout')), LATENCY_THRESHOLD_DOWN),
			)
			await Promise.race([
				provider.request({ method: 'eth_blockNumber', params: [] }),
				timeoutPromise,
			])
			const latencyMs = Math.round(performance.now() - start)
			const chainStatus: ChainStatus['status'] = (
				latencyMs > LATENCY_THRESHOLD_DEGRADED ? 'degraded' : 'healthy'
			)
			return {
				chainId,
				status: chainStatus,
				latencyMs,
				lastChecked: Date.now(),
			}
		} catch (e) {
			return {
				chainId,
				status: 'down',
				latencyMs: null,
				lastChecked: Date.now(),
				error: e instanceof Error ? e.message : 'Unknown error',
			}
		}
	}

	const checkLifiApi = async (): Promise<'healthy' | 'degraded' | 'down'> => {
		try {
			const start = performance.now()
			const response = await fetch('https://li.quest/v1/status', {
				signal: AbortSignal.timeout(5000),
			})
			const latency = performance.now() - start
			if (!response.ok) return 'down'
			if (latency > 2000) return 'degraded'
			return 'healthy'
		} catch {
			return 'down'
		}
	}

	const checkAll = async (chainIds: number[]) => {
		const [chainResults, lifiStatus] = await Promise.all([
			Promise.all(chainIds.map(checkChain)),
			checkLifiApi(),
		])
		const chains = new Map(chainResults.map((r) => [r.chainId, r]))
		const hasDown =
			chainResults.some((r) => r.status === 'down') || lifiStatus === 'down'
		const hasDegraded =
			chainResults.some((r) => r.status === 'degraded') || lifiStatus === 'degraded'
		const overall: NetworkStatus['overall'] = (
			hasDown ? 'down'
			: hasDegraded ? 'degraded'
			: 'healthy'
		)
		status = {
			chains,
			lifiApi: lifiStatus,
			overall,
			lastUpdated: Date.now(),
		}
	}

	const start = (chainIds: number[]) => {
		checkAll(chainIds)
		checkInterval = setInterval(() => checkAll(chainIds), CHECK_INTERVAL)
	}

	const stop = () => {
		if (checkInterval) {
			clearInterval(checkInterval)
			checkInterval = null
		}
	}

	const getChainStatus = (chainId: number): ChainStatus | undefined => (
		status.chains.get(chainId)
	)

	return {
		get status() {
			return status
		},
		start,
		stop,
		checkAll,
		checkChain,
		getChainStatus,
	}
}

export const networkStatus = createNetworkStatusStore()
