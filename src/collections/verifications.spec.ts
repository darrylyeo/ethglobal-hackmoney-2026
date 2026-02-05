/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import { verificationKey } from './verifications-keys.ts'

Deno.test('verificationKey generates correct composite key', () => {
	assertEquals(
		verificationKey('R1', 'verifier1', 'sharer1', '0xABC123', 1000),
		'R1:verifier1:sharer1:0xabc123:1000',
	)
})

Deno.test('verificationKey normalizes address to lowercase', () => {
	const k1 = verificationKey('R', 'v', 's', '0xABCDEF', 1)
	const k2 = verificationKey('R', 'v', 's', '0xabcdef', 1)
	assertEquals(k1, k2)
})
