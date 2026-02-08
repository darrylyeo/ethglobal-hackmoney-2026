/// <reference lib='deno.ns' />
import type { UniswapPosition } from '$/data/UniswapPosition.ts'
import { normalizeUniswapPosition } from './UniswapPositionsNormalize.ts'
import { assertEquals, assertExists } from 'jsr:@std/assert'

Deno.test(
	'normalizeUniswapPosition returns position with bigint liquidity and owed',
	() => {
		const entry: UniswapPosition = {
			id: '1',
			chainId: 1,
			poolId: '0xpool',
			owner: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
			tickLower: -100,
			tickUpper: 100,
			liquidity: 5000n,
			token0Owed: 0n,
			token1Owed: 0n,
		}
		const row = normalizeUniswapPosition(entry)
		assertExists(row.id)
		assertEquals(row.liquidity, 5000n)
		assertEquals(row.token0Owed, 0n)
		assertEquals(row.token1Owed, 0n)
	},
)
