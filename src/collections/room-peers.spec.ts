/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'
import { roomPeerKey } from './room-peers-keys.ts'

Deno.test('roomPeerKey generates correct composite key', () => {
	assertEquals(
		roomPeerKey('ABC123', 'peer-xyz'),
		'ABC123:peer-xyz',
	)
})

Deno.test('roomPeerKey differentiates by roomId', () => {
	assertEquals(roomPeerKey('R1', 'p1'), 'R1:p1')
	assertEquals(roomPeerKey('R2', 'p1'), 'R2:p1')
})

Deno.test('roomPeerKey differentiates by peerId', () => {
	assertEquals(roomPeerKey('R1', 'p1'), 'R1:p1')
	assertEquals(roomPeerKey('R1', 'p2'), 'R1:p2')
})
