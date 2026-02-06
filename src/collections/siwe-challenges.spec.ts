/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import { siweChallengeKey } from './siwe-challenges-keys.ts'

Deno.test('siweChallengeKey generates correct composite key', () => {
	assertEquals(
		siweChallengeKey('R1', 'fromPeer', 'toPeer', '0xABC'),
		'R1:fromPeer:toPeer:0xabc',
	)
})

Deno.test('siweChallengeKey normalizes address to lowercase', () => {
	assertEquals(
		siweChallengeKey('R', 'a', 'b', '0xABCD'),
		siweChallengeKey('R', 'a', 'b', '0xabcd'),
	)
})
