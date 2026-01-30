/// <reference lib="deno.ns" />
import { assertEquals, assertExists } from 'jsr:@std/assert'
import { normalizeNetwork } from './networks.ts'

Deno.test('networks collection normalization: returns one network row with id and name', () => {
	const row = normalizeNetwork({ id: 1, name: 'Ethereum' })
	assertExists(row.id)
	assertExists(row.name)
	assertEquals(typeof row.id, 'number')
	assertEquals(row.id, 1)
	assertEquals(row.name, 'Ethereum')
})
