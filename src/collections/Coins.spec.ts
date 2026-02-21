/// <reference lib='deno.ns' />
import { assertEquals, assertExists } from 'jsr:@std/assert'
import { erc20Instances } from '$/constants/coin-instances.ts'
import { toCoinRow } from './Coins.ts'

Deno.test('toCoinRow returns row with $id, chainId, address, symbol, decimals', () => {
	const t = erc20Instances[0]
	const row = toCoinRow(t)
	assertExists(row.$id)
	assertEquals(row.$id.$network.chainId, t.chainId)
	assertEquals(row.$id.address, t.address)
	assertExists(row.chainId)
	assertExists(row.address)
	assertExists(row.symbol)
	assertExists(row.decimals)
	assertEquals(typeof row.chainId, 'number')
	assertEquals(typeof row.address, 'string')
	assertEquals(row.address.startsWith('0x'), true)
	assertEquals(typeof row.symbol, 'string')
	assertEquals(typeof row.decimals, 'number')
})
