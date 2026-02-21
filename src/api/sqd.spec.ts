/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import {
	getSqdDatasetSlug,
	getSqdPortalBaseUrl,
	fetchSqdHead,
} from '$/api/sqd.ts'
import { ChainId } from '$/constants/chain-id.ts'

Deno.test('getSqdDatasetSlug: Ethereum returns ethereum-mainnet', () => {
	assertEquals(getSqdDatasetSlug(ChainId.Ethereum), 'ethereum-mainnet')
})

Deno.test('getSqdDatasetSlug: Base returns base-mainnet', () => {
	assertEquals(getSqdDatasetSlug(ChainId.Base), 'base-mainnet')
})

Deno.test('getSqdDatasetSlug: unsupported chain returns null', () => {
	assertEquals(getSqdDatasetSlug(ChainId.XDC), null)
})

Deno.test('getSqdPortalBaseUrl: Ethereum returns Portal URL', () => {
	assertEquals(
		getSqdPortalBaseUrl(ChainId.Ethereum),
		'https://portal.sqd.dev/datasets/ethereum-mainnet',
	)
})

Deno.test('getSqdPortalBaseUrl: unsupported chain returns null', () => {
	assertEquals(getSqdPortalBaseUrl(ChainId.XDC), null)
})

Deno.test('fetchSqdHead: returns block number from mocked response', async () => {
	const originalFetch = globalThis.fetch
	globalThis.fetch = async (input: RequestInfo | URL) => {
		const url =
			typeof input === 'string'
				? input
				: input instanceof Request
					? input.url
					: (input as URL).href
		if (!url.endsWith('/head')) return new Response('', { status: 404 })
		return new Response(JSON.stringify({ number: 21_000_000 }), {
			headers: { 'Content-Type': 'application/json' },
		})
	}
	try {
		const out = await fetchSqdHead(ChainId.Ethereum)
		assertEquals(out?.number, 21_000_000)
	} finally {
		globalThis.fetch = originalFetch
	}
})
