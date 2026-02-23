/// <reference lib='deno.ns' />
import { assertEquals, assertExists } from 'jsr:@std/assert'
import { erc20Instances } from '$/constants/coin-instances.ts'
import { toCoinRow } from './Coins.ts'

Deno.test('toCoinRow returns row with $id, symbol, decimals', () => {
	const t = erc20Instances[0]
	const row = toCoinRow(t)
	assertExists(row.$id)
	assertEquals(row.$id.$network.chainId, t.$id.$network.chainId)
	assertEquals(row.$id.address, t.$id.address)
	assertExists(row.symbol)
	assertExists(row.decimals)
	assertEquals(typeof row.$id.$network.chainId, 'number')
	assertEquals(typeof row.$id.address, 'string')
	assertEquals(row.$id.address.startsWith('0x'), true)
	assertEquals(typeof row.symbol, 'string')
	assertEquals(typeof row.decimals, 'number')
})
