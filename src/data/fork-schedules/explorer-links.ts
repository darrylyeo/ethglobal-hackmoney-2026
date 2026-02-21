import type { ChainId } from '$/constants/networks.ts'
import { networksByChainId } from '$/constants/networks.ts'

const FORKCAST_URL = 'https://forkcast.org'

export type ForkContextLinks = {
	forkcast: string
	forkedBlocksUrl?: string
}

export function getForkContextLinks(chainId: ChainId): ForkContextLinks {
	const base = networksByChainId[chainId]?.explorerUrls?.[0]
	return {
		forkcast: FORKCAST_URL,
		forkedBlocksUrl: base ? `${base.replace(/\/$/, '')}/blocks_forked` : undefined,
	}
}
