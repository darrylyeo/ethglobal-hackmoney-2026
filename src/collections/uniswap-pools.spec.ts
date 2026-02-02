/// <reference lib='deno.ns' />
import { assertEquals, assertExists } from 'jsr:@std/assert'
import {
	normalizeUniswapPool,
	type UniswapPool,
} from './uniswap-pools-normalize.ts'

Deno.test(
	'normalizeUniswapPool returns pool with bigint sqrtPriceX96 and liquidity',
	() => {
		const entry: UniswapPool = {
			id: '0xabc',
			chainId: 1,
			token0: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
			token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
			fee: 3000,
			tickSpacing: 60,
			hooks: '0x0000000000000000000000000000000000000000' as `0x${string}`,
			sqrtPriceX96: 79228162514264337593543950336n,
			liquidity: 1000000n,
			tick: 0,
		}
		const row = normalizeUniswapPool(entry)
		assertExists(row.id)
		assertEquals(row.chainId, 1)
		assertEquals(row.sqrtPriceX96, 79228162514264337593543950336n)
		assertEquals(row.liquidity, 1000000n)
	},
)

Deno.test('normalizeUniswapPool coerces string amounts to bigint', () => {
	const row = normalizeUniswapPool({
		id: '0x',
		chainId: 1,
		token0: '0x0' as `0x${string}`,
		token1: '0x0' as `0x${string}`,
		fee: 100,
		tickSpacing: 1,
		hooks: '0x0' as `0x${string}`,
		sqrtPriceX96: '100' as unknown as bigint,
		liquidity: '200' as unknown as bigint,
		tick: 0,
	})
	assertEquals(row.sqrtPriceX96, 100n)
	assertEquals(row.liquidity, 200n)
})
