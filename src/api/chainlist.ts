/**
 * Chainlist (chainlist.org / DefiLlama) API client. Used only to populate ChainIdChains collection.
 * For chainId lookup use networksByChainId from $/constants/networks.ts.
 */

export const CHAINLIST_RPCS_URL = 'https://chainlist.org/rpcs.json'

export type ChainListNativeCurrency = {
	name: string
	symbol: string
	decimals: number
}

export type ChainListChain = {
	name: string
	chainId: number
	shortName?: string
	chainSlug?: string
	networkId?: number
	nativeCurrency: ChainListNativeCurrency
	rpc?: string[]
	faucets?: string[]
	infoURL?: string
	isTestnet?: boolean
}

type ChainListRawChain = {
	name: string
	chainId: number
	shortName?: string
	chainSlug?: string
	networkId?: number
	nativeCurrency: ChainListNativeCurrency
	rpc?: { url: string }[]
	faucets?: string[]
	infoURL?: string
	isTestnet?: boolean
}

export const fetchChainlistChains = async () => {
	const res = await fetch(CHAINLIST_RPCS_URL)
	if (!res.ok) throw new Error(`chainlist: ${res.status}`)
	const raw = (await res.json()) as ChainListRawChain[]
	return raw.map((raw) => ({
		name: raw.name,
		chainId: raw.chainId,
		shortName: raw.shortName,
		chainSlug: raw.chainSlug,
		networkId: raw.networkId,
		nativeCurrency: raw.nativeCurrency,
		rpc: raw.rpc?.map((e) => e.url),
		faucets: raw.faucets,
		infoURL: raw.infoURL,
		isTestnet: raw.isTestnet,
	}))
}
