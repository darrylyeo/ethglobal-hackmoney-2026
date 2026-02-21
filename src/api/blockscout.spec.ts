/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import { fetchAbiFromBlockscout } from './blockscout.ts'
import { ChainId } from '$/constants/chain-id.ts'

const address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`

Deno.test('fetchAbiFromBlockscout: unsupported chain returns null without calling fetch', async () => {
	const out = await fetchAbiFromBlockscout(ChainId.XDC, address)
	assertEquals(out, null)
})

Deno.test('fetchAbiFromBlockscout: status 1 and valid result JSON returns ABI array', async () => {
	const abi = [{ type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }] }]
	const originalFetch = globalThis.fetch
	globalThis.fetch = async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input instanceof Request ? input.url : (input as URL).href
		if (!url.includes('getabi')) return new Response('', { status: 404 })
		return new Response(
			JSON.stringify({ status: '1', message: 'OK', result: JSON.stringify(abi) }),
			{ headers: { 'Content-Type': 'application/json' } },
		)
	}
	try {
		const out = await fetchAbiFromBlockscout(ChainId.Ethereum, address)
		assertEquals(Array.isArray(out), true)
		assertEquals((out as unknown as unknown[]).length, 1)
		assertEquals((out as unknown as unknown[])[0], abi[0])
	} finally {
		globalThis.fetch = originalFetch
	}
})

Deno.test('fetchAbiFromBlockscout: status 0 returns null', async () => {
	const originalFetch = globalThis.fetch
	globalThis.fetch = async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input instanceof Request ? input.url : (input as URL).href
		if (!url.includes('getabi')) return new Response('', { status: 404 })
		return new Response(
			JSON.stringify({ status: '0', message: 'Not verified', result: null }),
			{ headers: { 'Content-Type': 'application/json' } },
		)
	}
	try {
		const out = await fetchAbiFromBlockscout(ChainId.Ethereum, address)
		assertEquals(out, null)
	} finally {
		globalThis.fetch = originalFetch
	}
})
