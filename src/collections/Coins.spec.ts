/// <reference lib='deno.ns' />
import { assertEquals, assertExists } from 'jsr:@std/assert'
import { normalizeCoin } from './Coins.ts'

Deno.test(
	'coins collection normalization: returns one coin row with $id, chainId, address, symbol, decimals',
	() => {
		const row = normalizeCoin({
			chainId: 1,
			address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
			symbol: 'USDC',
			decimals: 6,
		})
		assertExists(row.$id)
		assertEquals(row.$id.$network.chainId, 1)
		assertEquals(row.$id.address, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
		assertExists(row.chainId)
		assertExists(row.address)
		assertExists(row.symbol)
		assertExists(row.decimals)
		assertEquals(typeof row.chainId, 'number')
		assertEquals(typeof row.address, 'string')
		assertEquals(row.address.startsWith('0x'), true)
		assertEquals(typeof row.symbol, 'string')
		assertEquals(typeof row.decimals, 'number')
	},
)
