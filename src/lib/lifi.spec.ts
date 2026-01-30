import { describe, expect, it, vi } from 'vitest'
import type { LiFiStep } from '@lifi/sdk'
import { queryClient } from '$/lib/db/query-client'
import {
	fetchQuoteCached,
	getQuoteForUsdcBridge,
	normalizeQuote,
	type NormalizedQuote,
} from './lifi'

vi.mock('@lifi/sdk', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@lifi/sdk')>()
	const mockStep: LiFiStep = {
		action: {
			fromChainId: 1,
			toChainId: 42161,
			fromAmount: '1000000',
			toAmount: '998500',
			fromToken: {} as LiFiStep['action']['fromToken'],
			toToken: {} as LiFiStep['action']['toToken'],
			fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
			slippage: 0.005,
		} as LiFiStep['action'],
		estimate: {
			gasCosts: [
				{
					amount: '150000',
					token: { symbol: 'ETH', address: '0x', chainId: 1, decimals: 18 },
				},
			],
		},
		tool: 'lifi',
		includedSteps: [],
	} as LiFiStep
	return {
		...actual,
		createConfig: vi.fn(),
		getQuote: vi.fn(() => Promise.resolve(mockStep)),
	}
})

const mockLiFiStep: LiFiStep = {
	action: {
		fromChainId: 1,
		toChainId: 42161,
		fromAmount: '1000000',
		toAmount: '998500',
		fromToken: {} as LiFiStep['action']['fromToken'],
		toToken: {} as LiFiStep['action']['toToken'],
		fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
		slippage: 0.005,
	} as LiFiStep['action'],
	estimate: {
		gasCosts: [
			{ amount: '150000', token: { symbol: 'ETH', address: '0x', chainId: 1, decimals: 18 } },
		],
	},
	tool: 'lifi',
	includedSteps: [],
} as LiFiStep

describe('LI.FI routes and quotes', () => {
	it('normalizeQuote: given mock LI.FI response, produces expected route/quote shape (steps, amounts, fees)', () => {
		const out = normalizeQuote(mockLiFiStep)
		expect(out).toMatchObject({
			steps: [
				{
					fromChainId: 1,
					toChainId: 42161,
					fromAmount: '1000000',
					toAmount: '998500',
					estimatedGasCosts: [{ amount: '150000', token: { symbol: 'ETH' } }],
				},
			],
			fromChainId: 1,
			toChainId: 42161,
			fromAmount: '1000000',
			toAmount: '998500',
			estimatedToAmount: '998500',
			fees: [{ amount: '150000', token: { symbol: 'ETH' } }],
		} satisfies Partial<NormalizedQuote>)
		expect(out.steps).toHaveLength(1)
		expect(typeof out.estimatedToAmount).toBe('string')
	})

	it('getQuoteForUsdcBridge: test-configurable source/dest chain and amount, returns normalized quote', async () => {
		const quote = await getQuoteForUsdcBridge({
			fromChain: 1,
			toChain: 42161,
			fromAmount: '1000000',
			fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
		})
		expect(quote.steps).toHaveLength(1)
		expect(quote.steps[0]).toMatchObject({
			fromChainId: 1,
			toChainId: 42161,
			fromAmount: '1000000',
			toAmount: '998500',
		})
		expect(quote.estimatedToAmount).toBe('998500')
		expect(quote.fees).toBeDefined()
	})

	it('fetchQuoteCached: app state (query cache) holds normalized quote consumed by test', async () => {
		queryClient.clear()
		const params = {
			fromChain: 1,
			toChain: 42161,
			fromAmount: '1000000',
			fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
		}
		const quote = await fetchQuoteCached(params)
		expect(quote).toMatchObject({
			steps: [
				{
					fromChainId: 1,
					toChainId: 42161,
					fromAmount: '1000000',
					toAmount: '998500',
				},
			],
			fromChainId: 1,
			toChainId: 42161,
			fromAmount: '1000000',
			toAmount: '998500',
			estimatedToAmount: '998500',
			fees: [{ amount: '150000', token: { symbol: 'ETH' } }],
		} satisfies Partial<NormalizedQuote>)
		const cached = await fetchQuoteCached(params)
		expect(cached).toStrictEqual(quote)
	})
})
