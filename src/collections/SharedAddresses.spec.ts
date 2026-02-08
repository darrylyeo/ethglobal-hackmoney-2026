/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import { sharedAddressKey } from './SharedAddressesKeys.ts'

Deno.test('sharedAddressKey share with all', () => {
	assertEquals(
		sharedAddressKey('R1', 'peer1', '0xABC123', null),
		'R1:peer1:0xabc123:all',
	)
})

Deno.test('sharedAddressKey share with specific peers', () => {
	assertEquals(
		sharedAddressKey('R1', 'peer1', '0xABC123', ['p2', 'p3']),
		'R1:peer1:0xabc123:p2,p3',
	)
})

Deno.test('sharedAddressKey normalizes address to lowercase', () => {
	assertEquals(
		sharedAddressKey('R', 'p', '0xABCDEF', null),
		sharedAddressKey('R', 'p', '0xabcdef', null),
	)
})
