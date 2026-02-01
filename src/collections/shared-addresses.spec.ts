/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import { sharedAddressKey } from './shared-addresses-keys.ts'

Deno.test('sharedAddressKey generates correct composite key', () => {
	assertEquals(
		sharedAddressKey('R1', 'peer1', '0xABC123'),
		'R1:peer1:0xabc123',
	)
})

Deno.test('sharedAddressKey normalizes address to lowercase', () => {
	const k1 = sharedAddressKey('R', 'p', '0xABCDEF')
	const k2 = sharedAddressKey('R', 'p', '0xabcdef')
	assertEquals(k1, k2)
})
