import { resolve } from '$app/paths'
import type { CaipEntry } from '$/data/CaipEntry.ts'
import type { ProposalEntry } from '$/data/ProposalEntry.ts'
import { ProposalType } from '$/data/ProposalEntry.ts'

export enum ProposalRealm {
	ChainAgnostic = 'chain-agnostic',
	Ethereum = 'ethereum',
}

export type ProposalSlugKind = ProposalType | 'caip'

const EIP_ERC_RE = /^(eip|erc)-(\d+)$/i
const CAIP_RE = /^caip-(\d+)$/i

export function parseProposalRealmParam(param: string): ProposalRealm | null {
	if (param === ProposalRealm.Ethereum || param === ProposalRealm.ChainAgnostic) return param
	return null
}

export function getProposalPath(
	realm: ProposalRealm,
	entry: Pick<ProposalEntry, 'type' | 'number'> | Pick<CaipEntry, 'number'>,
): string {
	if (realm === ProposalRealm.ChainAgnostic) {
		return resolve(`/proposals/${realm}/caip-${(entry as CaipEntry).number}`)
	}
	const p = entry as ProposalEntry
	const kind = p.type === ProposalType.Erc ? 'erc' : 'eip'
	return resolve(`/proposals/${realm}/${kind}-${p.number}`)
}

export function parseProposalSlug(slug: string): { kind: ProposalSlugKind; number: number } | null {
	const eipErc = slug.match(EIP_ERC_RE)
	if (eipErc) {
		const num = parseInt(eipErc[2], 10)
		if (!Number.isInteger(num) || num < 0) return null
		return {
			kind: eipErc[1].toLowerCase() === 'erc' ? ProposalType.Erc : ProposalType.Eip,
			number: num,
		}
	}
	const caip = slug.match(CAIP_RE)
	if (caip) {
		const num = parseInt(caip[1], 10)
		if (!Number.isInteger(num) || num < 0) return null
		return { kind: 'caip', number: num }
	}
	return null
}

export function proposalSlug(
	entry: Pick<ProposalEntry, 'type' | 'number'> | Pick<CaipEntry, 'number'>,
): string {
	if ('type' in entry) {
		return entry.type === ProposalType.Erc ? `erc-${entry.number}` : `eip-${entry.number}`
	}
	return `caip-${entry.number}`
}
