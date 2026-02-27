/**
 * EIP-8004 Identity Registry: fetch service ids and URIs from chain,
 * then resolve registration document (name, description, contact).
 * https://eips.ethereum.org/EIPS/eip-8004
 */

import type { VoltaireProvider } from '$/api/voltaire.ts'
import { createProviderForChain } from '$/lib/helios-rpc.ts'
import type { Eip8004Service, Eip8004Service$Id } from '$/data/Eip8004Service.ts'
import { eip8004RegistryConfigs } from '$/constants/eip-8004-registry.ts'
import { Abi, decodeParameters, encodeFunction } from '@tevm/voltaire/Abi'
import { fromBytes as hexFromBytes, toBytes } from '@tevm/voltaire/Hex'

const REGISTRY_ABI = Abi([
	{
		type: 'function',
		name: 'getAgentCount',
		stateMutability: 'view',
		inputs: [],
		outputs: [{ type: 'uint256', name: '' }],
	},
	{
		type: 'function',
		name: 'getAgentIdByIndex',
		stateMutability: 'view',
		inputs: [{ type: 'uint256', name: 'index' }],
		outputs: [{ type: 'bytes32', name: '' }],
	},
	{
		type: 'function',
		name: 'getAgentUri',
		stateMutability: 'view',
		inputs: [{ type: 'bytes32', name: 'agentId' }],
		outputs: [{ type: 'string', name: '' }],
	},
]) as unknown as import('@tevm/voltaire/Abi').Abi

const UINT256_OUTPUT = [{ type: 'uint256' as const, name: '' }] as const
const BYTES32_OUTPUT = [{ type: 'bytes32' as const, name: '' }] as const
const STRING_OUTPUT = [{ type: 'string' as const, name: '' }] as const

function bytes32ToHex(bytes: Uint8Array): string {
	const hex = hexFromBytes(bytes)
	return hex.length === 66 ? hex : `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`
}

async function fetchAgentCount(
	provider: VoltaireProvider,
	contractAddress: `0x${string}`,
): Promise<number> {
	const data = encodeFunction(REGISTRY_ABI, 'getAgentCount', [])
	const res = await provider.request({
		method: 'eth_call',
		params: [{ to: contractAddress, data }, 'latest'],
	})
	if (typeof res !== 'string' || !res || res === '0x') return 0
	const [n] = decodeParameters(
		UINT256_OUTPUT,
		toBytes(res as `0x${string}`),
	) as unknown as [bigint]
	return Number(n ?? 0n)
}

async function fetchAgentIdByIndex(
	provider: VoltaireProvider,
	contractAddress: `0x${string}`,
	index: number,
): Promise<string | null> {
	const data = encodeFunction(REGISTRY_ABI, 'getAgentIdByIndex', [
		BigInt(index),
	])
	const res = await provider.request({
		method: 'eth_call',
		params: [{ to: contractAddress, data }, 'latest'],
	})
	if (typeof res !== 'string' || !res || res.length < 66) return null
	const [bytes] = decodeParameters(
		BYTES32_OUTPUT,
		toBytes(res as `0x${string}`),
	) as unknown as [Uint8Array]
	return bytes ? bytes32ToHex(bytes) : null
}

async function fetchAgentUri(
	provider: VoltaireProvider,
	contractAddress: `0x${string}`,
	agentIdHex: `0x${string}`,
): Promise<string | null> {
	const data = encodeFunction(REGISTRY_ABI, 'getAgentUri', [agentIdHex])
	const res = await provider.request({
		method: 'eth_call',
		params: [{ to: contractAddress, data }, 'latest'],
	})
	if (typeof res !== 'string' || !res || res === '0x') return null
	const [str] = decodeParameters(
		STRING_OUTPUT,
		toBytes(res as `0x${string}`),
	) as [string]
	return str && str.length > 0 ? str : null
}

export type RegistrationDocument = {
	name?: string
	description?: string
	image?: string
	contactEndpoint?: string
	services?: Array<{ type: string; url?: string; name?: string }>
}

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'

export function ipfsUriToHttp(uri: string): string {
	const trimmed = uri.trim()
	if (trimmed.startsWith('ipfs://'))
		return `${IPFS_GATEWAY}${trimmed.slice(7)}`
	if (trimmed.startsWith('https://') || trimmed.startsWith('http://'))
		return trimmed
	return `${IPFS_GATEWAY}${trimmed}`
}

function parseServices(raw: unknown): Array<{ type: string; url?: string; name?: string }> | undefined {
	if (!Array.isArray(raw)) return undefined
	return raw
		.map((item) => {
			if (item == null || typeof item !== 'object') return null
			const o = item as Record<string, unknown>
			const type = typeof o.type === 'string' ? o.type : undefined
			if (!type) return null
			return {
				type,
				url: typeof o.url === 'string' ? o.url : undefined,
				name: typeof o.name === 'string' ? o.name : undefined,
			}
		})
		.filter((x): x is { type: string; url?: string; name?: string } => x !== null)
}

export async function fetchRegistrationDocument(
	uri: string,
): Promise<RegistrationDocument | null> {
	try {
		const url = ipfsUriToHttp(uri)
		const res = await fetch(url)
		if (!res.ok) return null
		const json = (await res.json()) as Record<string, unknown>
		return {
			name: typeof json.name === 'string' ? json.name : undefined,
			description:
				typeof json.description === 'string' ? json.description : undefined,
			image: typeof json.image === 'string' ? json.image : undefined,
			contactEndpoint:
				typeof json.contactEndpoint === 'string'
					? json.contactEndpoint
					: typeof json.contact === 'string'
						? json.contact
						: undefined,
			services: parseServices(json.services ?? json.endpoints),
		}
	} catch {
		return null
	}
}

export async function fetchEip8004Services(): Promise<Eip8004Service[]> {
	const results: Eip8004Service[] = []
	const now = Date.now()
	for (const { contract } of eip8004RegistryConfigs) {
		const { $network, address } = contract
		const provider = createProviderForChain($network.chainId)
		let count: number
		try {
			count = await fetchAgentCount(provider, address)
		} catch {
			continue
		}
		for (let i = 0; i < count; i++) {
			const identityId = await fetchAgentIdByIndex(provider, address, i)
			if (!identityId) continue
			const uri = await fetchAgentUri(
				provider,
				address,
				identityId as `0x${string}`,
			)
			const doc = uri ? await fetchRegistrationDocument(uri) : null
			results.push({
				$id: { chainId: $network.chainId, identityId },
				contractAddress: address,
				registrationUri: uri ?? '',
				name: doc?.name,
				description: doc?.description,
				image: doc?.image,
				contactEndpoint: doc?.contactEndpoint,
				services: doc?.services,
				fetchedAt: now,
			})
		}
	}
	return results
}

export async function fetchEip8004Service(
	id: Eip8004Service$Id,
): Promise<Eip8004Service | null> {
	const config = eip8004RegistryConfigs.find(
		(c) => c.contract.$network.chainId === id.chainId,
	)
	if (!config) return null
	const provider = createProviderForChain(id.chainId)
	const uri = await fetchAgentUri(
		provider,
		config.contract.address,
		id.identityId as `0x${string}`,
	)
	const doc = uri ? await fetchRegistrationDocument(uri) : null
	return {
		$id: id,
		contractAddress: config.contract.address,
		registrationUri: uri ?? '',
		name: doc?.name,
		description: doc?.description,
		image: doc?.image,
		contactEndpoint: doc?.contactEndpoint,
		services: doc?.services,
		fetchedAt: Date.now(),
	}
}
