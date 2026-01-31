/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import {
	decodeBalanceOfResult,
	encodeAllowanceCall,
	encodeApproveCall,
	encodeBalanceOfCall,
	getChainId,
	getErc20Balance,
	type VoltaireProvider,
} from './voltaire.ts'
Deno.test('getChainId: calls eth_chainId and returns chain ID as bigint', async () => {
	let requestedMethod: string | undefined
	const provider: VoltaireProvider = {
		request: async (args) => {
			requestedMethod = (args as { method: string }).method
			return '0x1'
		},
		on: () => provider,
		removeListener: () => provider,
	}
	const chainId = await getChainId(provider)
	assertEquals(requestedMethod, 'eth_chainId')
	assertEquals(chainId, 1n)
})
Deno.test('encodeBalanceOfCall: produces balanceOf selector + encoded address', () => {
	const account = '0x742d35Cc6634C0532925a3b844Bc454e4798e506' as `0x${string}`
	const data = encodeBalanceOfCall(account)
	assertEquals(data.startsWith('0x'), true)
	assertEquals(data.startsWith('0x70a08231'), true)
	assertEquals(data.length >= 2 + 4 + 64, true)
})
Deno.test('decodeBalanceOfResult: decodes eth_call hex to bigint', () => {
	const hex =
		'0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'
	assertEquals(decodeBalanceOfResult(hex), 1000000000000000000n)
})
Deno.test('getErc20Balance: calls eth_call with to and encoded data, returns decoded balance', async () => {
	let callParams: { to: string; data: string } | undefined
	const provider: VoltaireProvider = {
		request: async (args) => {
			if ((args as { method: string }).method === 'eth_call') {
				callParams = (
					args as unknown as { params: [{ to: string; data: string }] }
				).params[0]
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
	assertEquals(callParams?.to, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
	assertEquals(callParams?.data?.startsWith('0x70a08231'), true)
	assertEquals(balance, 1000000000000000000n)
})

Deno.test('encodeAllowanceCall generates correct calldata', () => {
	const data = encodeAllowanceCall(
		'0x1234567890123456789012345678901234567890' as `0x${string}`,
		'0xabcdef0123456789abcdef0123456789abcdef01' as `0x${string}`,
	)
	assertEquals(data.slice(0, 10), '0xdd62ed3e')
	assertEquals(data.length, 138)
})

Deno.test('encodeApproveCall generates correct calldata', () => {
	const data = encodeApproveCall(
		'0xabcdef0123456789abcdef0123456789abcdef01' as `0x${string}`,
		1000000n,
	)
	assertEquals(data.slice(0, 10), '0x095ea7b3')
	assertEquals(data.length, 138)
})
