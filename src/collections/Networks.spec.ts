/// <reference lib='deno.ns' />
import { assertEquals, assertExists } from 'jsr:@std/assert'
import { NetworkType } from '$/constants/networks.ts'
import { normalizeNetwork } from './Networks.ts'

Deno.test(
	'networks collection normalization: returns one network row with $id, id, name and type',
	() => {
		const network = normalizeNetwork({
			id: 1,
			name: 'Ethereum',
			type: NetworkType.Mainnet,
		})
		assertExists(network.$id)
		assertExists(network.id)
		assertExists(network.name)
		assertExists(network.type)
		assertEquals(network.$id, 1)
		assertEquals(network.id, 1)
		assertEquals(network.name, 'Ethereum')
		assertEquals(network.type, NetworkType.Mainnet)
	},
)
