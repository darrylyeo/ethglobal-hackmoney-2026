import { describe, expect, it, vi } from 'vitest'
import type { LiFiStep } from '@lifi/sdk'
import { queryClient } from '$/lib/db/query-client'
import {
	extractFeeBreakdown,
	fetchQuoteCached,
	getQuoteForUsdcBridge,
	type NormalizedQuote,
	normalizeQuote,
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
			fromAddress:
				'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
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
			{
				amount: '150000',
				token: { symbol: 'ETH', address: '0x', chainId: 1, decimals: 18 },
			},
		],
	},
	tool: 'lifi',
	includedSteps: [],
} as LiFiStep
describe('LI.FI routes and quotes', () => {
	it('normalizeQuote: given mock LI.FI response, produces expected route/quote shape (steps, amounts, fees)', () => {
		const out = normalizeQuote(mockLiFiStep)
		expect(out).toMatchObject(
			{
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
			} satisfies Partial<NormalizedQuote>,
		)
		expect(out.steps).toHaveLength(1)
		expect(typeof out.estimatedToAmount).toBe('string')
	})
	it('getQuoteForUsdcBridge: test-configurable source/dest chain and amount, returns normalized quote', async () => {
		const { quote } = await getQuoteForUsdcBridge({
			fromChain: 1,
			toChain: 42161,
			fromAmount: '1000000',
			fromAddress:
				'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
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
			fromAddress:
				'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
		}
		const result = await fetchQuoteCached(params)
		expect(result.quote).toMatchObject(
			{
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
			} satisfies Partial<NormalizedQuote>,
		)
		const cached = await fetchQuoteCached(params)
		expect(cached).toStrictEqual(result)
	})
})

describe('extractFeeBreakdown', () => {
	it('extracts gas costs from route steps', () => {
		const route = {
			steps: [
				{
					action: { fromChainId: 1 },
					estimate: {
						gasCosts: [
							{
								amount: '150000',
								amountUSD: '0.45',
								token: { symbol: 'ETH', decimals: 18 },
							},
						],
					},
				},
			],
			fromAmountUSD: '1',
		}
		const out = extractFeeBreakdown(route)
		expect(out.gasCost).toHaveLength(1)
		expect(out.gasCost[0]).toMatchObject({
			amount: '150000',
			amountUsd: '0.45',
			token: { symbol: 'ETH', decimals: 18 },
			chainId: 1,
		})
		expect(out.totalUsd).toBe('0.45')
	})

	it('extracts protocol/bridge fees from route steps', () => {
		const route = {
			steps: [
				{
					action: { fromChainId: 1 },
					toolDetails: { name: 'LI.FI' },
					estimate: {
						feeCosts: [
							{
								name: 'Bridge fee',
								amount: '100',
								amountUSD: '0.10',
								token: { symbol: 'USDC', decimals: 6 },
							},
						],
					},
				},
			],
			fromAmountUSD: '10',
		}
		const out = extractFeeBreakdown(route)
		expect(out.protocolFees).toHaveLength(1)
		expect(out.protocolFees[0]).toMatchObject({
			name: 'Bridge fee',
			amount: '100',
			amountUsd: '0.10',
			token: { symbol: 'USDC', decimals: 6 },
		})
		expect(out.totalUsd).toBe('0.10')
	})

	it('calculates total in USD and percentage of transfer', () => {
		const route = {
			steps: [
				{
					action: { fromChainId: 1 },
					estimate: {
						gasCosts: [{ amount: '0', amountUSD: '0.50', token: {} }],
						feeCosts: [{ name: 'Fee', amount: '0', amountUSD: '0.50', token: {} }],
					},
				},
			],
			fromAmountUSD: '100',
		}
		const out = extractFeeBreakdown(route)
		expect(out.totalUsd).toBe('1.00')
		expect(out.percentOfTransfer).toBe(1)
	})

	it('handles missing fee data gracefully', () => {
		const out = extractFeeBreakdown({ steps: [] })
		expect(out.gasCost).toHaveLength(0)
		expect(out.protocolFees).toHaveLength(0)
		expect(out.totalUsd).toBe('0.00')
		expect(out.percentOfTransfer).toBe(0)
	})

	it('uses first step estimate.fromAmountUSD when route.fromAmountUSD missing', () => {
		const route = {
			steps: [
				{
					action: { fromChainId: 1 },
					estimate: { fromAmountUSD: '50', gasCosts: [{ amount: '0', amountUSD: '1', token: {} }] },
				},
			],
		}
		const out = extractFeeBreakdown(route)
		expect(out.percentOfTransfer).toBe(2)
	})
})
