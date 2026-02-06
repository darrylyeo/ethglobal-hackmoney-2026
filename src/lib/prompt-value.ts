import type { EntityRef } from '$/data/EntityRef'
import { EntityType } from '$/data/$EntityType'
import {
	EntityRefPattern,
	entityRefPatternsConfig,
} from '$/constants/entity-ref-patterns'

const atPattern = new RegExp(
	`@(?:${
		Object.values(EntityRefPattern)
			.sort((a, b) => (
				entityRefPatternsConfig[b].matchComplexity - entityRefPatternsConfig[a].matchComplexity
			))
			.map((p) => `(?<${p}>${entityRefPatternsConfig[p].pattern.source})`)
			.join('|')
	})`,
	'g',
)

const patternToEntityType = (pattern: EntityRefPattern): EntityType => (
	pattern === EntityRefPattern.EvmAddress
		? EntityType.Actor
		: pattern === EntityRefPattern.EvmBlockNumber
			? EntityType.Block
			: pattern === EntityRefPattern.EvmTransactionHash
				? EntityType.Transaction
				: EntityType.DialogueTurn
)

export function parseValueToSegmentsAndRefs(value: string): {
	segments: string[]
	refs: EntityRef[]
} {
	const refs: EntityRef[] = []
	const matches = [...value.matchAll(atPattern)]
	for (const match of matches) {
		const groups = match.groups ?? {}
		const matchedPattern = (Object.values(EntityRefPattern) as EntityRefPattern[]).find(
			(p) => groups[p],
		)
		if (!matchedPattern) continue
		refs.push({
			entityType: patternToEntityType(matchedPattern),
			entityId: groups[matchedPattern],
			displayLabel: `@${groups[matchedPattern]}`,
		})
	}
	const segments: string[] = []
	let lastEnd = 0
	for (const match of matches) {
		const start = match.index ?? 0
		const end = start + (match[0]?.length ?? 0)
		segments.push(value.slice(lastEnd, start))
		lastEnd = end
	}
	segments.push(value.slice(lastEnd))
	return { segments, refs }
}

export function getValueFromSegmentsAndRefs(
	segments: string[],
	refs: EntityRef[],
): string {
	if (segments.length !== refs.length + 1) return segments.join('')
	return segments
		.reduce(
			(acc, seg, i) => (
				i < refs.length ? acc + seg + refs[i].displayLabel : acc + seg
			),
			'',
		)
}
