import type { EntityRef } from '$/data/EntityRef.ts'
import { EntityType } from '$/data/$EntityType.ts'
	import { agentChatTurnsCollection } from '$/collections/AgentChatTurns.ts'
import { actorsCollection } from '$/collections/Actors.ts'
import { actorKey } from '$/collections/Actors.ts'
import { blocksCollection } from '$/collections/Blocks.ts'
import { bridgeTransactionsCollection } from '$/collections/BridgeTransactions.ts'
import { stringify } from 'devalue'

export type EntitySuggestion = { ref: EntityRef, label: string }

const agentChatTurnToSuggestion = (turn: { id: string, userPrompt: string }): EntitySuggestion => ({
	ref: {
		entityType: EntityType.AgentChatTurn,
		entityId: turn.id,
		displayLabel: `@${turn.id}`,
	},
	label: turn.userPrompt.slice(0, 40) || turn.id,
})

const actorToSuggestion = (row: { $id: { network: number, address: `0x${string}` } }): EntitySuggestion => {
	const id = actorKey(row.$id.network, row.$id.address)
	return {
		ref: {
			entityType: EntityType.Actor,
			entityId: id,
			displayLabel: `@${row.$id.address}`,
		},
		label: row.$id.address,
	}
}

const blockToSuggestion = (row: { $id: { chainId: number, blockNumber: number } }): EntitySuggestion => {
	const id = `${row.$id.chainId}:${row.$id.blockNumber}`
	return {
		ref: {
			entityType: EntityType.Block,
			entityId: id,
			displayLabel: `@${id}`,
		},
		label: `Block ${row.$id.blockNumber}`,
	}
}

const txToSuggestion = (row: { $id: { sourceTxHash: string } }): EntitySuggestion => {
	const id = stringify(row.$id)
	return {
		ref: {
			entityType: EntityType.Transaction,
			entityId: id,
			displayLabel: `@${row.$id.sourceTxHash}`,
		},
		label: row.$id.sourceTxHash,
	}
}

export function getEntitySuggestionsFromCache(query: string): EntitySuggestion[] {
	const q = query.trim().toLowerCase()
	const results: EntitySuggestion[] = []

	for (const turn of agentChatTurnsCollection.state.values())
		results.push(agentChatTurnToSuggestion(turn))

	for (const row of actorsCollection.state.values())
		results.push(actorToSuggestion(row))

	for (const row of blocksCollection.state.values())
		results.push(blockToSuggestion(row))

	for (const row of bridgeTransactionsCollection.state.values())
		results.push(txToSuggestion(row))

	if (q === '') return results.slice(0, 50)
	return results
		.filter(
			(s) =>
				s.ref.entityId.toLowerCase().includes(q)
				|| s.ref.displayLabel.toLowerCase().includes(q)
				|| s.label.toLowerCase().includes(q),
		)
		.slice(0, 50)
}
