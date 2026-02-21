/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import { fetchSqdHead } from '$/api/sqd.ts'
import { SQD_DATASETS_BY_CHAIN_ID } from '$/constants/sqd-datasets.ts'
import { ChainId } from '$/constants/chain-id.ts'

Deno.test('SQD_DATASETS_BY_CHAIN_ID: Ethereum returns ethereum-mainnet slug', () => {
	assertEquals(SQD_DATASETS_BY_CHAIN_ID[ChainId.Ethereum]?.slug, 'ethereum-mainnet')
})

Deno.test('SQD_DATASETS_BY_CHAIN_ID: Base returns base-mainnet slug', () => {
	assertEquals(SQD_DATASETS_BY_CHAIN_ID[ChainId.Base]?.slug, 'base-mainnet')
})

Deno.test('SQD_DATASETS_BY_CHAIN_ID: unsupported chain has no slug', () => {
	assertEquals(SQD_DATASETS_BY_CHAIN_ID[ChainId.XDC]?.slug, undefined)
})

Deno.test('SQD portal URL from slug: Ethereum', () => {
	const slug = SQD_DATASETS_BY_CHAIN_ID[ChainId.Ethereum]?.slug
	assertEquals(
		slug ? `https://portal.sqd.dev/datasets/${slug}` : null,
		'https://portal.sqd.dev/datasets/ethereum-mainnet',
	)
})

Deno.test('SQD portal URL from slug: unsupported chain', () => {
	const slug = SQD_DATASETS_BY_CHAIN_ID[ChainId.XDC]?.slug
	assertEquals(slug ? `https://portal.sqd.dev/datasets/${slug}` : null, null)
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
