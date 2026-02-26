/// <reference lib='deno.ns' />
import { assertEquals, assertExists } from 'jsr:@std/assert'
import { erc20Instances } from '$/constants/coin-instances.ts'
import { toCoinRow } from './Coins.ts'

Deno.test('toCoinRow returns row with $id, symbol, decimals', () => {
	const t = erc20Instances[0]
	const coin = toCoinRow(t)
	assertExists(coin.$id)
	assertEquals(coin.$id.$network.chainId, t.$id.$network.chainId)
	assertEquals(coin.$id.address, t.$id.address)
	assertExists(coin.symbol)
	assertExists(coin.decimals)
	assertEquals(typeof coin.$id.$network.chainId, 'number')
	assertEquals(typeof coin.$id.address, 'string')
	assertEquals(coin.$id.address.startsWith('0x'), true)
	assertEquals(typeof coin.symbol, 'string')
	assertEquals(typeof coin.decimals, 'number')
})
