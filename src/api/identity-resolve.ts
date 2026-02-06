/**
 * Identity resolution using Voltaire RPC + ABI (no ethers/viem).
 * ENS forward (name → address + text) and reverse (address → name).
 */

import type { VoltaireProvider } from '$/api/voltaire.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	IdentityInputKind,
	identityResolversByKind,
	type IdentityResolution,
} from '$/constants/identity-resolver.ts'
import { ChainId } from '$/constants/networks.ts'
import { isValidAddress } from '$/lib/address.ts'
import { Abi, decodeParameters, encodeFunction } from '@tevm/voltaire/Abi'
import { namehash } from '@tevm/voltaire/Ens'
import { fromBytes as hexFromBytes, toBytes } from '@tevm/voltaire/Hex'

const ENS_REGISTRY_ABI = Abi([
	{
		type: 'function',
		name: 'resolver',
		stateMutability: 'view',
		inputs: [{ type: 'bytes32', name: 'node', }],
		outputs: [{ type: 'address', name: '', }],
	},
]) as unknown as import('@tevm/voltaire/Abi').Abi
const RESOLVER_ADDR_ABI = Abi([
	{
		type: 'function',
		name: 'addr',
		stateMutability: 'view',
		inputs: [{ type: 'bytes32', name: 'node', }],
		outputs: [{ type: 'address', name: '', }],
	},
]) as unknown as import('@tevm/voltaire/Abi').Abi
const RESOLVER_TEXT_ABI = Abi([
	{
		type: 'function',
		name: 'text',
		stateMutability: 'view',
		inputs: [
			{ type: 'bytes32', name: 'node' },
			{ type: 'string', name: 'key' },
		],
		outputs: [{ type: 'string', name: '' }],
	},
]) as unknown as import('@tevm/voltaire/Abi').Abi
const ADDRESS_OUTPUT = [{ type: 'address' as const, name: '' }] as const
const STRING_OUTPUT = [{ type: 'string' as const, name: '' }] as const

function bytes32FromNamehash(nodeBytes: Uint8Array): `0x${string}` {
	const hex = hexFromBytes(nodeBytes)
	return (
		hex.length === 66
			? (hex as `0x${string}`)
			: (`0x${Array.from(nodeBytes)
					.map((b) => b.toString(16).padStart(2, '0'))
					.join('')}` as `0x${string}`)
	)
}

export function normalizeIdentity(raw: string): {
	kind: IdentityInputKind
	normalized: string
} {
	const trimmed = raw.trim()
	if (!trimmed) {
		return { kind: IdentityInputKind.Address, normalized: '' }
	}
	if (isValidAddress(trimmed)) {
		return {
			kind: IdentityInputKind.Address,
			normalized: trimmed.toLowerCase().startsWith('0x')
				? trimmed.toLowerCase()
				: (`0x${trimmed.toLowerCase()}` as `0x${string}`),
		}
	}
	if (trimmed.includes('.') && trimmed.length > 4) {
		return {
			kind: IdentityInputKind.EnsName,
			normalized: trimmed.toLowerCase().replace(/^\.+|\.+$/g, ''),
		}
	}
	return { kind: IdentityInputKind.Address, normalized: trimmed }
}

async function getResolverAddress(
	provider: VoltaireProvider,
	registryAddress: `0x${string}`,
	node: `0x${string}`,
): Promise<`0x${string}` | null> {
	const data = encodeFunction(ENS_REGISTRY_ABI, 'resolver', [node])
	const res = await provider.request({
		method: 'eth_call',
		params: [{ to: registryAddress, data, }, 'latest', ],
	})
	if (typeof res !== 'string' || !res || res === '0x' || res.length < 66)
		return null
	const [addr] = decodeParameters(
		ADDRESS_OUTPUT,
		toBytes(res as `0x${string}`),
	) as unknown as [`0x${string}`]
	const zero = '0x0000000000000000000000000000000000000000'
	return addr && addr.toLowerCase() !== zero ? addr : null
}

async function resolveAddr(
	provider: VoltaireProvider,
	resolverAddress: `0x${string}`,
	node: `0x${string}`,
): Promise<`0x${string}` | null> {
	const data = encodeFunction(RESOLVER_ADDR_ABI, 'addr', [node])
	const res = await provider.request({
		method: 'eth_call',
		params: [{ to: resolverAddress, data, }, 'latest', ],
	})
	if (typeof res !== 'string' || !res || res === '0x' || res.length < 66)
		return null
	const [addr] = decodeParameters(
		ADDRESS_OUTPUT,
		toBytes(res as `0x${string}`),
	) as unknown as [`0x${string}`]
	const zero = '0x0000000000000000000000000000000000000000'
	return addr && addr.toLowerCase() !== zero ? addr : null
}

async function resolveText(
	provider: VoltaireProvider,
	resolverAddress: `0x${string}`,
	node: `0x${string}`,
	key: string,
): Promise<string> {
	const data = encodeFunction(RESOLVER_TEXT_ABI, 'text', [node, key])
	const res = await provider.request({
		method: 'eth_call',
		params: [{ to: resolverAddress, data, }, 'latest', ],
	})
	if (typeof res !== 'string' || !res || res === '0x') return ''
	const [str] = decodeParameters(
		STRING_OUTPUT,
		toBytes(res as `0x${string}`),
	) as [string]
	return str ?? ''
}

export async function resolveEnsForward(
	provider: VoltaireProvider,
	registryAddress: `0x${string}`,
	name: string,
	textKeys: string[] = ['avatar', ],
): Promise<{
	address: `0x${string}` | null
	textRecords: Record<string, string>
}> {
	const nodeBytes = namehash(name)
	const node = bytes32FromNamehash(nodeBytes)
	const resolverAddress = await getResolverAddress(
		provider,
		registryAddress,
		node,
	)
	if (!resolverAddress) {
		return { address: null, textRecords: {} }
	}
	const address = await resolveAddr(provider, resolverAddress, node)
	const textRecords: Record<string, string> = {}
	for (const key of textKeys) {
		const value = await resolveText(provider, resolverAddress, node, key)
		if (value) textRecords[key] = value
	}
	return { address, textRecords }
}

function reverseNode(address: `0x${string}`): `0x${string}` {
	const addrHex = address.toLowerCase().slice(2).padStart(40, '0')
	const label = `${addrHex}.addr.reverse`
	const nodeBytes = namehash(label)
	return bytes32FromNamehash(nodeBytes)
}

export async function resolveEnsReverse(
	provider: VoltaireProvider,
	registryAddress: `0x${string}`,
	address: `0x${string}`,
): Promise<string | null> {
	const node = reverseNode(address)
	const resolverAddress = await getResolverAddress(
		provider,
		registryAddress,
		node,
	)
	if (!resolverAddress) return null
	const nameResolverAbi = Abi([
		{
			type: 'function',
			name: 'name',
			stateMutability: 'view',
			inputs: [{ type: 'bytes32', name: 'node' }],
			outputs: [{ type: 'string', name: '' }],
		},
	]) as unknown as import('@tevm/voltaire/Abi').Abi
	const data = encodeFunction(nameResolverAbi, 'name', [node])
	const res = await provider.request({
		method: 'eth_call',
		params: [{ to: resolverAddress, data, }, 'latest', ],
	})
	if (typeof res !== 'string' || !res || res === '0x') return null
	const [nameStr] = decodeParameters(
		STRING_OUTPUT,
		toBytes(res as `0x${string}`),
	) as [string]
	return nameStr && nameStr.length > 0 ? nameStr : null
}

export async function resolveIdentity(
	provider: VoltaireProvider,
	chainId: ChainId,
	raw: string,
	existing: IdentityResolution | null,
): Promise<Partial<IdentityResolution>> {
	const now = Date.now()
	const { kind, normalized } = normalizeIdentity(raw)
	const resolvers = identityResolversByKind.get(kind) ?? []
	const resolver = resolvers.find((r) => r.chainId === chainId && r.ensRegistry)
	if (!resolver?.ensRegistry) {
		return {
			...existing,
			raw,
			normalized,
			kind,
			chainId,
			resolverId: undefined,
			updatedAt: now,
		}
	}
	const base = {
		...existing,
		raw,
		normalized,
		kind,
		chainId,
		resolverId: resolver.id,
		source: DataSource.Voltaire,
		updatedAt: now,
	}
	if (kind === IdentityInputKind.EnsName) {
		const { address, textRecords } = await resolveEnsForward(
			provider,
			resolver.ensRegistry,
			normalized,
			resolver.textRecordKeys ?? ['avatar'],
		)
		const avatarUrl = textRecords['avatar']
		return {
			...base,
			address: address ?? undefined,
			textRecords:
				Object.keys(textRecords).length > 0 ? textRecords : undefined,
			avatarUrl: avatarUrl || undefined,
			resolvedAt: now,
		}
	}
	if (
		kind === IdentityInputKind.Address &&
		normalized.startsWith('0x') &&
		normalized.length === 42
	) {
		const name = await resolveEnsReverse(
			provider,
			resolver.ensRegistry,
			normalized as `0x${string}`,
		)
		return {
			...base,
			address: normalized as `0x${string}`,
			name: name ?? undefined,
			resolvedAt: now,
		}
	}
	return { ...base }
}
