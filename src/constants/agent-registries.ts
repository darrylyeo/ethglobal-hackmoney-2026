/**
 * Browseable agent registries: list and label for nav and list UI.
 * Registry-specific config (e.g. contract addresses) lives in eip-8004-registry.ts.
 */

import { EntityType } from '$/data/$EntityType.ts'

export type AgentRegistryEntry = {
	id: string
	label: string
	listHref: string
	entityType: EntityType.Eip8004Agent
}

export const agentRegistries: readonly AgentRegistryEntry[] = [
	{
		id: 'eip8004',
		label: 'EIP-8004',
		listHref: '/agents/registry',
		entityType: EntityType.Eip8004Agent,
	},
] as const
