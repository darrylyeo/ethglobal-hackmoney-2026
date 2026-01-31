import { env } from '$env/dynamic/private'
import { ercTokens } from '$/constants/coins'
import {
	buildGraph,
	fetchAllTransfers,
	periodToRange,
	TIME_PERIODS,
} from '$/lib/transfers-indexer'

const USDC_CHAINS = ercTokens.map((t) => ({
	chainId: t.chainId,
	contractAddress: t.address,
}))

export async function load({ url }) {
	const periodParam = url.searchParams.get('period') ?? '1d'
	const periodDef = TIME_PERIODS.find((p) => p.value === periodParam) ?? TIME_PERIODS[3]
	const { start, end } = periodToRange(periodDef.ms)
	const apiKey = env.COVALENT_API_KEY ?? ''
	const transfers =
		apiKey.length > 0
			? await fetchAllTransfers(USDC_CHAINS, start, end, apiKey)
			: []
	const graph = buildGraph(transfers)
	return {
		graph,
		period: periodDef.value,
		periods: TIME_PERIODS,
	}
}
