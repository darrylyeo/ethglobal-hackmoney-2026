import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getIntentsQuote, getIntentsBridgeQuote } from './lifi-intents.ts'

const mockGetUsdcAddress = vi.fn(() =>
	'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
)
vi.mock('$/api/lifi.ts', () => ({
	getUsdcAddress: (chainId: number) => mockGetUsdcAddress(chainId),
}))

const mockQuoteResponse = {
	quotes: [
		{
			validUntil: Math.floor(Date.now() / 1000) + 60,
			quoteId: 'quote_test123' as `quote_${string}`,
			preview: {
				inputs: [{ user: '0x', asset: '0x', amount: '1000000' }],
				outputs: [{ receiver: '0x', asset: '0x' }],
			},
			metadata: { exclusiveFor: null },
			partialFill: false,
		},
	],
}

describe('getIntentsQuote', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => mockQuoteResponse,
		} as Response)
	})

	afterEach(() => {
		fetchSpy.mockRestore()
	})

	it('builds OIF request with one input and one output (same chainId), uses interop addresses, returns normalized quote', async () => {
		const params = {
			chainId: 1,
			tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
			tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
			amount: 1_000_000n,
			userAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
		}
		const quote = await getIntentsQuote(params)
		expect(fetchSpy).toHaveBeenCalledTimes(1)
		const [url, opts] = fetchSpy.mock.calls[0]
		expect(url).toMatch(/order\.li\.fi.*quote\/request/)
		expect(opts?.method).toBe('POST')
		const body = JSON.parse(opts?.body as string)
		expect(body.intent?.intentType).toBe('oif-swap')
		expect(body.intent?.swapType).toBe('exact-input')
		expect(body.intent?.inputs).toHaveLength(1)
		expect(body.intent?.outputs).toHaveLength(1)
		expect(body.intent.inputs[0].amount).toBe('1000000')
		expect(body.user).toMatch(/^0x[a-fA-F0-9]+$/)
		expect(body.intent.inputs[0].asset).toMatch(/^0x[a-fA-F0-9]+$/)
		expect(body.intent.outputs[0].asset).toMatch(/^0x[a-fA-F0-9]+$/)
		expect(Array.isArray(body.supportedTypes)).toBe(true)
		expect(body.supportedTypes.every((t: unknown) => typeof t === 'string')).toBe(true)
		expect(quote).not.toBeNull()
		expect(quote?.quoteId).toBe('quote_test123')
		expect(quote?.validUntil).toBe(mockQuoteResponse.quotes[0].validUntil)
		expect(quote?.preview.inputs).toHaveLength(1)
		expect(quote?.preview.outputs).toHaveLength(1)
	})
})

describe('getIntentsBridgeQuote', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		mockGetUsdcAddress.mockReturnValue(
			'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
		)
		fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => mockQuoteResponse,
		} as Response)
	})

	afterEach(() => {
		fetchSpy.mockRestore()
	})

	it('builds OIF request with one input (fromChain + coin) and one output (toChain + same coin, receiver), uses getUsdcAddress and interop addresses', async () => {
		const params = {
			fromChainId: 1,
			toChainId: 42161,
			amount: 1_000_000n,
			fromAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
			toAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`,
		}
		const quote = await getIntentsBridgeQuote(params)
		expect(mockGetUsdcAddress).toHaveBeenCalledWith(1)
		expect(mockGetUsdcAddress).toHaveBeenCalledWith(42161)
		expect(fetchSpy).toHaveBeenCalledTimes(1)
		const [url, opts] = fetchSpy.mock.calls[0]
		expect(url).toMatch(/order\.li\.fi.*quote\/request/)
		const body = JSON.parse(opts?.body as string)
		expect(body.intent?.intentType).toBe('oif-swap')
		expect(body.intent?.inputs).toHaveLength(1)
		expect(body.intent?.outputs).toHaveLength(1)
		expect(body.intent.inputs[0].amount).toBe('1000000')
		expect(body.user).toMatch(/^0x[a-fA-F0-9]+$/)
		expect(body.intent.outputs[0].receiver).toMatch(/^0x[a-fA-F0-9]+$/)
		expect(Array.isArray(body.supportedTypes)).toBe(true)
		expect(quote).not.toBeNull()
		expect(quote?.quoteId).toBe('quote_test123')
	})
})
