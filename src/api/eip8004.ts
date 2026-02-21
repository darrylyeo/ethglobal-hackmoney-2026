/**
 * EIP-8004 Trustless Agent Registry: fetch agent ids and URIs from chain,
 * then resolve registration document (name, description, contact).
 * https://eips.ethereum.org/EIPS/eip-8004
 */

import type { VoltaireProvider } from '$/api/voltaire.ts'
import { createProviderForChain } from '$/lib/helios-rpc.ts'
import type { Eip8004Agent, Eip8004Agent$Id } from '$/data/Eip8004Agent.ts'
import { EIP8004_REGISTRY_CONFIGS } from '$/constants/eip8004-registry.ts'
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
	contactEndpoint?: string
}

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'

function ipfsUriToHttp(uri: string): string {
	const trimmed = uri.trim()
	if (trimmed.startsWith('ipfs://'))
		return `${IPFS_GATEWAY}${trimmed.slice(7)}`
	if (trimmed.startsWith('https://') || trimmed.startsWith('http://'))
		return trimmed
	return `${IPFS_GATEWAY}${trimmed}`
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
			contactEndpoint:
				typeof json.contactEndpoint === 'string'
					? json.contactEndpoint
					: typeof json.contact === 'string'
						? json.contact
						: undefined,
		}
	} catch {
		return null
	}
}

export async function fetchEip8004Agents(): Promise<Eip8004Agent[]> {
	const results: Eip8004Agent[] = []
	const now = Date.now()
	for (const { chainId, contractAddress } of EIP8004_REGISTRY_CONFIGS) {
		const provider = createProviderForChain(chainId)
		let count: number
		try {
			count = await fetchAgentCount(provider, contractAddress)
		} catch {
			continue
		}
		for (let i = 0; i < count; i++) {
			const identityId = await fetchAgentIdByIndex(
				provider,
				contractAddress,
				i,
			)
			if (!identityId) continue
			const uri = await fetchAgentUri(
				provider,
				contractAddress,
				identityId as `0x${string}`,
			)
			const doc = uri ? await fetchRegistrationDocument(uri) : null
			results.push({
				identityId,
				chainId,
				contractAddress,
				registrationUri: uri ?? '',
				name: doc?.name,
				description: doc?.description,
				contactEndpoint: doc?.contactEndpoint,
				fetchedAt: now,
			})
		}
	}
	return results
}

export async function fetchEip8004Agent(
	id: Eip8004Agent$Id,
): Promise<Eip8004Agent | null> {
	const config = EIP8004_REGISTRY_CONFIGS.find((c) => c.chainId === id.chainId)
	if (!config) return null
	const provider = createProviderForChain(id.chainId)
	const uri = await fetchAgentUri(
		provider,
		config.contractAddress,
		id.identityId as `0x${string}`,
	)
	const doc = uri ? await fetchRegistrationDocument(uri) : null
	return {
		identityId: id.identityId,
		chainId: id.chainId,
		contractAddress: config.contractAddress,
		registrationUri: uri ?? '',
		name: doc?.name,
		description: doc?.description,
		contactEndpoint: doc?.contactEndpoint,
		fetchedAt: Date.now(),
	}
}
