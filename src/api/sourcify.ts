/**
 * Sourcify API for verified contract source lookup.
 * https://docs.sourcify.dev/docs/api/
 */

import type { ChainId } from '$/constants/networks.ts'
import type { ContractAbi } from '$/data/Contract.ts'
import type { VerifiedContractSourceEntry } from '$/data/VerifiedContractSource.ts'

const SOURCIFY_SERVER = 'https://sourcify.dev/server'

export type ContractWithAbi = {
	abi?: ContractAbi
	source?: 'Sourcify'
}

/** Fetch contract metadata including ABI from Sourcify. Returns null if not verified. */
export async function fetchContractWithAbi(
	chainId: ChainId,
	address: `0x${string}`,
): Promise<ContractWithAbi | null> {
	const url = `${SOURCIFY_SERVER}/v2/contract/${chainId}/${address}?fields=abi`
	const res = await fetch(url)
	if (!res.ok) return null
	const json = (await res.json()) as { abi?: unknown[] }
	const abi = json.abi
	if (!abi || !Array.isArray(abi)) return null
	return {
		abi: abi as ContractAbi,
		source: 'Sourcify',
	}
}

export async function fetchVerifiedContract(
	chainId: ChainId,
	address: `0x${string}`,
): Promise<VerifiedContractSourceEntry | null> {
	const url = `${SOURCIFY_SERVER}/v2/contract/${chainId}/${address}?fields=sources,compilation`
	const res = await fetch(url)
	if (!res.ok) return null
	const json = (await res.json()) as {
		sources?: Record<string, { content?: string }>
		compilation?: {
			language?: string
			compilerVersion?: string
			fullyQualifiedName?: string
		}
	}
	const sources = json.sources ?? {}
	const files: Record<string, string> = {}
	for (const [path, entry] of Object.entries(sources)) {
		if (entry?.content != null) files[path] = entry.content
	}
	if (Object.keys(files).length === 0) return null
	return {
		$id: {
			$network: { chainId },
			address: address.toLowerCase() as `0x${string}`,
		},
		metadata: json.compilation
			? {
					compiler: json.compilation.compilerVersion,
					language: json.compilation.language,
					sources: json.compilation,
					fullyQualifiedName: json.compilation.fullyQualifiedName,
				}
			: undefined,
		files,
	}
}
