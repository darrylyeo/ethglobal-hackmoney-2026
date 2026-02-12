import type { Network$Id } from '$/data/Network.ts'

export type VerifiedContractSource$Id = {
	$network: Network$Id
	address: `0x${string}`
}

export type VerifiedContractSourceEntry = {
	$id: VerifiedContractSource$Id
	metadata?: {
		compiler?: string
		language?: string
		sources?: Record<string, unknown>
		fullyQualifiedName?: string
	}
	files: Record<string, string>
}
