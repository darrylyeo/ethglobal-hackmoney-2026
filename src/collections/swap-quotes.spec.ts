/// <reference lib='deno.ns' />
import { assertEquals, assertExists } from 'jsr:@std/assert'
import { normalizeSwapQuote, type SwapQuote } from './swap-quotes-normalize.ts'

Deno.test('normalizeSwapQuote returns quote with bigint amountIn, amountOut, gasEstimate', () => {
	const entry: SwapQuote = {
		id: 'q1',
		chainId: 1,
		tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
		tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
		amountIn: 1_000_000n,
		amountOut: 500_000n,
		priceImpact: 0.1,
		route: [],
		gasEstimate: 150_000n,
		timestamp: Date.now(),
	}
	const row = normalizeSwapQuote(entry)
	assertExists(row.id)
	assertEquals(row.amountIn, 1_000_000n)
	assertEquals(row.amountOut, 500_000n)
	assertEquals(row.gasEstimate, 150_000n)
})
