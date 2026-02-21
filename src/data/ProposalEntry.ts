/**
 * Proposal entry: normalized metadata from ethereum/EIPs and ethereum/ercs repos.
 * Umbrella term is Proposal; type (ProposalType) discriminates Eip vs Erc.
 * Official link: https://eips.ethereum.org/EIPS/eip-{number}
 */

import type { DataSource } from '$/constants/data-sources.ts'

export enum ProposalType {
	Eip = 'Eip',
	Erc = 'Erc',
}

export type ProposalEntry$Id = { id: string }

export type ProposalEntry = {
	number: number
	title: string
	status: string
	/** Standards-track category: Core, Networking, Interface, ERC, Meta, Informational */
	category: string
	url: string
	type: ProposalType
	$source: DataSource
}
