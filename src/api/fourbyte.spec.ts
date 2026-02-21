/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import {
	fetchEventSignatures,
	fetchFunctionSignatures,
} from './fourbyte.ts'

Deno.test('fetchFunctionSignatures: results array returns text_signature list', async () => {
	const originalFetch = globalThis.fetch
	globalThis.fetch = async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input instanceof Request ? input.url : (input as URL).href
		if (!url.includes('/signatures/')) return new Response('', { status: 404 })
		return new Response(
			JSON.stringify({
				results: [
					{ text_signature: 'transfer(address,uint256)', hex_signature: '0xa9059cbb' },
				],
			}),
			{ headers: { 'Content-Type': 'application/json' } },
		)
	}
	try {
		const out = await fetchFunctionSignatures('0xa9059cbb' as `0x${string}`)
		assertEquals(out, ['transfer(address,uint256)'])
	} finally {
		globalThis.fetch = originalFetch
	}
})

Deno.test('fetchFunctionSignatures: res.not ok returns empty array', async () => {
	const originalFetch = globalThis.fetch
	globalThis.fetch = () => Promise.resolve(new Response('', { status: 500 }))
	try {
		const out = await fetchFunctionSignatures('0xa9059cbb' as `0x${string}`)
		assertEquals(out, [])
	} finally {
		globalThis.fetch = originalFetch
	}
})

Deno.test('fetchEventSignatures: results array returns text_signature list', async () => {
	const originalFetch = globalThis.fetch
	globalThis.fetch = async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input instanceof Request ? input.url : (input as URL).href
		if (!url.includes('event-signatures/')) return new Response('', { status: 404 })
		return new Response(
			JSON.stringify({
				results: [
					{
						text_signature: 'Transfer(address,address,uint256)',
						hex_signature: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
					},
				],
			}),
			{ headers: { 'Content-Type': 'application/json' } },
		)
	}
	try {
		const out = await fetchEventSignatures(
			'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as `0x${string}`,
		)
		assertEquals(out, ['Transfer(address,address,uint256)'])
	} finally {
		globalThis.fetch = originalFetch
	}
})
