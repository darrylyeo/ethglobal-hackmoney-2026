/**
 * Identity input and resolver: schema types, canonical kinds, and resolver config
 * for ENS (and future) resolution. Used by identity-links collection and
 * resolution API (Voltaire).
 */

import { DataSourceId } from '$/constants/data-sources.ts'
import { ChainId } from '$/constants/networks.ts'

export enum IdentityInputKind {
	Address = 'Address',
	EnsName = 'EnsName',
	EnsText = 'EnsText',
}

export enum IdentityResolutionStatus {
	Idle = 'Idle',
	Resolving = 'Resolving',
	Resolved = 'Resolved',
	Error = 'Error',
}

export type IdentityResolution = {
	id: string
	raw: string
	normalized: string
	kind: IdentityInputKind
	chainId?: ChainId
	resolverId?: string
	createdAt: number
	updatedAt: number
	resolvedAt?: number
	address?: `0x${string}`
	interopAddress?: string
	name?: string
	textRecords?: Record<string, string>
	avatarUrl?: string
	source: DataSourceId,
}

export type IdentityResolver = {
	id: string
	kind: IdentityInputKind
	chainId: ChainId
	source: DataSourceId
	ensRegistry?: `0x${string}`
	ensUniversalResolver?: `0x${string}`
	textRecordKeys?: string[],
}

export const IDENTITY_INPUT_KINDS = [
	IdentityInputKind.Address,
	IdentityInputKind.EnsName,
	IdentityInputKind.EnsText,
] as const satisfies readonly IdentityInputKind[]

export const ENS_REGISTRY_MAINNET =
	'0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const
const ENS_UNIVERSAL_RESOLVER_MAINNET =
	'0xc0497E381f536Be9ce14B0dD3817cBcAe57d2F62' as const

export const identityResolvers = [
	{
		id: 'ens-ethereum',
		kind: IdentityInputKind.EnsName,
		chainId: ChainId.Ethereum,
		source: DataSourceId.Voltaire,
		ensRegistry: ENS_REGISTRY_MAINNET,
		ensUniversalResolver: ENS_UNIVERSAL_RESOLVER_MAINNET,
		textRecordKeys: ['avatar', 'url', 'twitter'],
	},
	{
		id: 'ens-ethereum-reverse',
		kind: IdentityInputKind.Address,
		chainId: ChainId.Ethereum,
		source: DataSourceId.Voltaire,
		ensRegistry: ENS_REGISTRY_MAINNET,
		ensUniversalResolver: ENS_UNIVERSAL_RESOLVER_MAINNET,
		textRecordKeys: ['avatar', 'url', 'twitter'],
	},
] as const satisfies readonly IdentityResolver[]

export const identityResolversById = Object.fromEntries(
	identityResolvers.map((r) => [r.id, r]),
) as Record<string, IdentityResolver>

export const identityResolversByKind = Object.fromEntries(
	IDENTITY_INPUT_KINDS.map((k) => [
		k,
		identityResolvers.filter((r) => r.kind === k),
	]),
) as Record<IdentityInputKind, IdentityResolver[]>
