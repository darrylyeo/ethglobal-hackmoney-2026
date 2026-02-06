/// <reference lib='deno.ns' />
import { assertEquals, assertExists } from 'jsr:@std/assert'
import { NetworkType } from '$/constants/networks.ts'
import { normalizeNetwork } from './networks.ts'

Deno.test(
	'networks collection normalization: returns one network row with $id, id, name and type',
	() => {
		const row = normalizeNetwork({
			id: 1,
			name: 'Ethereum',
			type: NetworkType.Mainnet,
		})
		assertExists(row.$id)
		assertExists(row.id)
		assertExists(row.name)
		assertExists(row.type)
		assertEquals(row.$id, 1)
		assertEquals(row.id, 1)
		assertEquals(row.name, 'Ethereum')
		assertEquals(row.type, NetworkType.Mainnet)
	},
)
