/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'

const actorKey = (chainId: number, address: `0x${string}`) =>
	`${chainId}-${address.toLowerCase()}`

Deno.test('actorKey generates correct composite key', () => {
	assertEquals(actorKey(1, '0xABC123'), '1-0xabc123')
})

Deno.test('actorKey normalizes address to lowercase', () => {
	assertEquals(actorKey(1, '0xABCDEF'), actorKey(1, '0xabcdef'))
})

Deno.test('actorKey differentiates by chainId', () => {
	assertEquals(actorKey(1, '0xabc') !== actorKey(10, '0xabc'), true)
})
