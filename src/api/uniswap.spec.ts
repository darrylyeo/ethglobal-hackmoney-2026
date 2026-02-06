import {
	collectFees,
	createPool,
	fetchPositions,
	increaseLiquidity,
	removeLiquidity,
} from './uniswap.ts'
import { describe, expect, it } from 'vitest'

const mockProvider = {
	request: async () => undefined,
}

describe('uniswap API', () => {
	it('fetchPositions returns empty array when SDK not loaded', async () => {
		const result = await fetchPositions({
			chainId: 1,
			owner: '0x0000000000000000000000000000000000000001' as `0x${string}`,
		})
		expect(result).toEqual([])
	})

	it('createPool throws when SDK not loaded', async () => {
		await expect(
			createPool({
				provider: mockProvider,
				chainId: 1,
				token0: '0x0' as `0x${string}`,
				token1: '0x0' as `0x${string}`,
				fee: 3000,
				tickSpacing: 60,
				sqrtPriceX96: 2n ** 96n,
			}),
		).rejects.toThrow('Uniswap V4 SDK not loaded; create pool when configured')
	})

	it('collectFees throws when SDK not loaded', async () => {
		await expect(
			collectFees({
				provider: mockProvider,
				positionId: '1',
				recipient: '0x0' as `0x${string}`,
				amount0Max: 0n,
				amount1Max: 0n,
				deadline: 0,
			}),
		).rejects.toThrow('Uniswap V4 SDK not loaded; collect fees when configured')
	})

	it('increaseLiquidity throws when SDK not loaded', async () => {
		await expect(
			increaseLiquidity({
				provider: mockProvider,
				positionId: '1',
				amount0Desired: 0n,
				amount1Desired: 0n,
				amount0Min: 0n,
				amount1Min: 0n,
				deadline: 0,
			}),
		).rejects.toThrow(
			'Uniswap V4 SDK not loaded; increase liquidity when configured',
		)
	})

	it('removeLiquidity throws when SDK not loaded', async () => {
		await expect(
			removeLiquidity({
				provider: mockProvider,
				positionId: '1',
				liquidity: 0n,
				amount0Min: 0n,
				amount1Min: 0n,
				deadline: 0,
			}),
		).rejects.toThrow(
			'Uniswap V4 SDK not loaded; remove liquidity when configured',
		)
	})
})
