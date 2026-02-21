/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import {
	fetchEventSignatures,
	fetchFunctionSignatures,
} from './openchain.ts'

Deno.test('fetchFunctionSignatures: ok true and result.function returns name array', async () => {
	const originalFetch = globalThis.fetch
	globalThis.fetch = async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input instanceof Request ? input.url : (input as URL).href
		if (!url.includes('/lookup') || !url.includes('function=')) return new Response('', { status: 404 })
		return new Response(
			JSON.stringify({
				ok: true,
				result: {
					function: {
						'0xa9059cbb': [{ name: 'transfer(address,uint256)' }],
					},
				},
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

Deno.test('fetchEventSignatures: ok true and result.event returns name array', async () => {
	const topic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as `0x${string}`
	const originalFetch = globalThis.fetch
	globalThis.fetch = async (input: RequestInfo | URL) => {
		const url = typeof input === 'string' ? input : input instanceof Request ? input.url : (input as URL).href
		if (!url.includes('event=')) return new Response('', { status: 404 })
		return new Response(
			JSON.stringify({
				ok: true,
				result: {
					event: {
						'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': [
							{ name: 'Transfer(address,address,uint256)' },
						],
					},
				},
			}),
			{ headers: { 'Content-Type': 'application/json' } },
		)
	}
	try {
		const out = await fetchEventSignatures(topic)
		assertEquals(out, ['Transfer(address,address,uint256)'])
	} finally {
		globalThis.fetch = originalFetch
	}
})
