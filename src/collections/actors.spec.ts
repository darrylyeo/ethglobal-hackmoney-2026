/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'

const actorKey = (chainId: number, address: `0x${string}`) => (
	`${chainId}-${address.toLowerCase()}`
)

Deno.test('actorKey generates correct composite key', () => {
	assertEquals(
		actorKey(1, '0xABC123'),
		'1-0xabc123',
	)
})

Deno.test('actorKey normalizes address to lowercase', () => {
	const key1 = actorKey(1, '0xABCDEF')
	const key2 = actorKey(1, '0xabcdef')
	assertEquals(key1, key2)
})

Deno.test('actorKey differentiates by chainId', () => {
	const key1 = actorKey(1, '0xabc')
	const key2 = actorKey(10, '0xabc')
	assertEquals(key1 !== key2, true)
})
