/// <reference lib='deno.ns' />
import { IdentityInputKind } from '$/constants/identity-resolver.ts'
import { normalizeIdentity } from './identity-resolve.ts'
import { assertEquals } from 'jsr:@std/assert'

Deno.test('normalizeIdentity: empty string returns Address kind', () => {
	const { kind, normalized } = normalizeIdentity('  ')
	assertEquals(kind, IdentityInputKind.Address)
	assertEquals(normalized, '')
})

Deno.test('normalizeIdentity: valid address normalizes to lowercase 0x', () => {
	const { kind, normalized } = normalizeIdentity(
		'0x742d35Cc6634C0532925a3b844Bc454e4798e506',
	)
	assertEquals(kind, IdentityInputKind.Address)
	assertEquals(normalized, '0x742d35cc6634c0532925a3b844bc454e4798e506')
})

Deno.test('normalizeIdentity: ENS-like string returns EnsName kind', () => {
	const { kind, normalized } = normalizeIdentity('vitalik.eth')
	assertEquals(kind, IdentityInputKind.EnsName)
	assertEquals(normalized, 'vitalik.eth')
})

Deno.test('normalizeIdentity: subdomain normalizes', () => {
	const { kind, normalized } = normalizeIdentity('  foo.bar.eth  ')
	assertEquals(kind, IdentityInputKind.EnsName)
	assertEquals(normalized, 'foo.bar.eth')
})
