import { describe, expect, it } from 'vitest'
import type { Provider } from '@tevm/voltaire/provider'
import {
	decodeBalanceOfResult,
	encodeBalanceOfCall,
	getChainId,
	getErc20Balance,
} from './voltaire'

describe('Voltaire RPC and ABI', () => {
	it('getChainId: calls eth_chainId and returns chain ID as bigint', async () => {
		let requestedMethod: string | undefined
		const provider: Provider = {
			request: async (args) => {
				requestedMethod = (args as { method: string }).method
				return '0x1'
			},
			on: () => provider,
			removeListener: () => provider,
		}
		const chainId = await getChainId(provider)
		expect(requestedMethod).toBe('eth_chainId')
		expect(chainId).toBe(1n)
	})

	it('encodeBalanceOfCall: produces balanceOf selector + encoded address', () => {
		const account = '0x742d35Cc6634C0532925a3b844Bc454e4798e506' as `0x${string}`
		const data = encodeBalanceOfCall(account)
		expect(data.startsWith('0x')).toBe(true)
		expect(data.startsWith('0x70a08231')).toBe(true)
		expect(data.length).toBeGreaterThanOrEqual(2 + 4 + 64)
	})

	it('decodeBalanceOfResult: decodes eth_call hex to bigint', () => {
		const hex = '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'
		expect(decodeBalanceOfResult(hex)).toBe(1000000000000000000n)
	})

	it('getErc20Balance: calls eth_call with to and encoded data, returns decoded balance', async () => {
		let callParams: { to: string; data: string } | undefined
		const provider: Provider = {
			request: async (args) => {
				if ((args as { method: string }).method === 'eth_call') {
					callParams = (args as { params: [{ to: string; data: string }] }).params[0]
				}
				return '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'
			},
			on: () => provider,
			removeListener: () => provider,
		}
		const balance = await getErc20Balance(
			provider,
			'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
			'0x742d35Cc6634C0532925a3b844Bc454e4798e506' as `0x${string}`,
		)
		expect(callParams?.to).toBe('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
		expect(callParams?.data?.startsWith('0x70a08231')).toBe(true)
		expect(balance).toBe(1000000000000000000n)
	})
})
