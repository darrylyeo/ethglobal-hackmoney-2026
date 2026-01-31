/// <reference lib="deno.ns" />
import { assertEquals } from 'jsr:@std/assert'
import { getTxUrl, getAddressUrl } from './explorers.ts'

Deno.test('getTxUrl returns etherscan for chain 1', () => {
	assertEquals(getTxUrl(1, '0xabc'), 'https://etherscan.io/tx/0xabc')
})

Deno.test('getTxUrl returns optimistic etherscan for chain 10', () => {
	assertEquals(
		getTxUrl(10, '0xabc'),
		'https://optimistic.etherscan.io/tx/0xabc',
	)
})

Deno.test('getTxUrl returns Blockscan fallback for unknown chain', () => {
	assertEquals(
		getTxUrl(999999, '0xabc'),
		'https://blockscan.com/tx/0xabc',
	)
})

Deno.test('getAddressUrl returns address link for chain 1', () => {
	assertEquals(
		getAddressUrl(1, '0x1234567890123456789012345678901234567890'),
		'https://etherscan.io/address/0x1234567890123456789012345678901234567890',
	)
})

Deno.test('getAddressUrl returns Blockscan fallback for unknown chain', () => {
	assertEquals(
		getAddressUrl(999999, '0xdef'),
		'https://blockscan.com/address/0xdef',
	)
})
