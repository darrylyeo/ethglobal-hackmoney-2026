/**
 * Uniswap V4 subgraph client. Fetches positions by owner and pools; normalizes to UniswapPosition / UniswapPool.
 * Requires PUBLIC_GRAPH_API_KEY for The Graph gateway.
 */

import type { UniswapPool } from '$/data/UniswapPool.ts'
import type { UniswapPosition } from '$/data/UniswapPosition.ts'
import { getSubgraphUrl } from '$/constants/uniswap.ts'
import { env } from '$env/dynamic/public'

const POSITIONS_QUERY = `query Positions($owner: String!) {
  positions(where: { owner: $owner }) {
    id
    tokenId
    owner
    origin
    createdAtTimestamp
  }
}`

const POOL_QUERY = `query Pool($id: ID!) {
  pool(id: $id) {
    id
    token0 { id symbol decimals }
    token1 { id symbol decimals }
    feeTier
    sqrtPrice
    liquidity
    tick
    tickSpacing
    hooks
    volumeUSD
    totalValueLockedUSD
  }
}`

const POOLS_QUERY = `query Pools($first: Int!, $skip: Int!) {
  pools(first: $first, skip: $skip, orderBy: liquidity, orderDirection: desc) {
    id
    token0 { id symbol decimals }
    token1 { id symbol decimals }
    feeTier
    sqrtPrice
    liquidity
    tick
    tickSpacing
    hooks
    volumeUSD
    totalValueLockedUSD
  }
}`

type SubgraphPosition = {
	id: string
	tokenId: string
	owner: string
	origin: string
	createdAtTimestamp: string
}

type SubgraphToken = { id: string; symbol: string; decimals: string }

type SubgraphPool = {
	id: string
	token0: SubgraphToken
	token1: SubgraphToken
	feeTier: string
	sqrtPrice: string
	liquidity: string
	tick: string | null
	tickSpacing: string
	hooks: string
	volumeUSD: string
	totalValueLockedUSD: string
}

async function graphql<T>(
	url: string,
	query: string,
	variables: Record<string, unknown>,
): Promise<T> {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query, variables }),
	})
	if (!res.ok) throw new Error(`Subgraph ${res.status}: ${res.statusText}`)
	const json = (await res.json()) as { data?: T; errors?: { message: string }[] }
	if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '))
	if (json.data == null) throw new Error('No data')
	return json.data as T
}

function toPosition(chainId: number, p: SubgraphPosition): UniswapPosition {
	const tokenId = BigInt(p.tokenId)
	return {
		$id: { chainId, id: p.id },
		poolId: '',
		owner: p.owner as `0x${string}`,
		tickLower: 0,
		tickUpper: 0,
		liquidity: 0n,
		token0Owed: 0n,
		token1Owed: 0n,
		tokenId,
		origin: p.origin as `0x${string}`,
		createdAtTimestamp: Number(p.createdAtTimestamp),
	}
}

function toPool(chainId: number, p: SubgraphPool): UniswapPool {
	return {
		$id: { chainId, id: p.id },
		token0: p.token0.id as `0x${string}`,
		token1: p.token1.id as `0x${string}`,
		fee: Number(p.feeTier),
		tickSpacing: Number(p.tickSpacing),
		hooks: p.hooks as `0x${string}`,
		sqrtPriceX96: BigInt(p.sqrtPrice),
		liquidity: BigInt(p.liquidity),
		tick: p.tick != null ? Number(p.tick) : 0,
		token0Symbol: p.token0.symbol,
		token1Symbol: p.token1.symbol,
		token0Decimals: Number(p.token0.decimals),
		token1Decimals: Number(p.token1.decimals),
		volumeUSD: p.volumeUSD,
		totalValueLockedUSD: p.totalValueLockedUSD,
	}
}

export async function fetchPositionsFromSubgraph(params: {
	chainId: number
	owner: `0x${string}`
}): Promise<UniswapPosition[]> {
	const url = getSubgraphUrl(params.chainId, env.PUBLIC_GRAPH_API_KEY)
	if (!url) return []
	const data = await graphql<{ positions: SubgraphPosition[] }>(url, POSITIONS_QUERY, {
		owner: params.owner.toLowerCase(),
	})
	return (data.positions ?? []).map((p) => toPosition(params.chainId, p))
}

export async function fetchPoolFromSubgraph(params: {
	chainId: number
	poolId: string
}): Promise<UniswapPool | null> {
	const url = getSubgraphUrl(params.chainId, env.PUBLIC_GRAPH_API_KEY)
	if (!url) return null
	const data = await graphql<{ pool: SubgraphPool | null }>(url, POOL_QUERY, {
		id: params.poolId,
	})
	return data.pool ? toPool(params.chainId, data.pool) : null
}

export async function fetchPoolsFromSubgraph(params: {
	chainId: number
	first?: number
	skip?: number
}): Promise<UniswapPool[]> {
	const url = getSubgraphUrl(params.chainId, env.PUBLIC_GRAPH_API_KEY)
	if (!url) return []
	const first = params.first ?? 100
	const skip = params.skip ?? 0
	const data = await graphql<{ pools: SubgraphPool[] }>(url, POOLS_QUERY, { first, skip })
	return (data.pools ?? []).map((p) => toPool(params.chainId, p))
}
