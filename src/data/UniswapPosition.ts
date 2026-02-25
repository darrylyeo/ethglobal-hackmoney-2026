export type UniswapPosition$Id = { chainId: number; id: string }

export type UniswapPosition = {
	$id: UniswapPosition$Id
	poolId: string
	owner: `0x${string}`
	tickLower: number
	tickUpper: number
	liquidity: bigint
	token0Owed: bigint
	token1Owed: bigint
	tokenId?: bigint
	origin?: `0x${string}`
	createdAtTimestamp?: number
}

