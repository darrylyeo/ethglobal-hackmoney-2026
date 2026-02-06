import type { EntityRef } from '$/data/EntityRef'
import { EntityType } from '$/data/$EntityType'
import {
	EntityRefPattern,
	entityRefPatternsConfig,
} from '$/constants/entity-ref-patterns'

export type EntityRefTriggerConfig = Record<
	string,
	{ pattern: RegExp, buildRef: (value: string) => EntityRef }
>

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const patternToEntityType = (pattern: EntityRefPattern): EntityType => (
	pattern === EntityRefPattern.EvmAddress
		? EntityType.Actor
		: pattern === EntityRefPattern.EvmBlockNumber
			? EntityType.Block
			: pattern === EntityRefPattern.EvmTransactionHash
				? EntityType.Transaction
				: EntityType.AgentChatTurn
)

const entityPatternSource = (() => {
	const parts = Object.values(EntityRefPattern)
		.sort((a, b) => (
			entityRefPatternsConfig[b].matchComplexity - entityRefPatternsConfig[a].matchComplexity
		))
		.map((p) => `(?<${p}>${entityRefPatternsConfig[p].pattern.source})`)
	return `(?:${parts.join('|')})`
})()

function buildEntityRefFromGroups(trigger: string, groups: Record<string, string>): EntityRef {
	const matchedPattern = (Object.values(EntityRefPattern) as EntityRefPattern[]).find(
		(p) => groups[p],
	)
	if (!matchedPattern) throw new Error('No matching group')
	const value = groups[matchedPattern]
	return {
		entityType: patternToEntityType(matchedPattern),
		entityId: value,
		displayLabel: `${trigger}${value}`,
		trigger,
	}
}

const entityValuePattern = new RegExp('^(?:' + entityPatternSource + ')$')

export function buildDefaultEntityTriggerConfig(): EntityRefTriggerConfig {
	return {
		'@': {
			pattern: new RegExp(entityPatternSource),
			buildRef: (value: string) => {
				const m = value.match(entityValuePattern)
				if (!m?.groups) return {
					entityType: EntityType.AgentChatTurn,
					entityId: value,
					displayLabel: `@${value}`,
					trigger: '@',
				}
				return buildEntityRefFromGroups('@', m.groups as Record<string, string>)
			},
		},
	}
}

export function parseValueToSegmentsAndRefs(
	value: string,
	triggerConfig: EntityRefTriggerConfig,
): { segments: string[], refs: EntityRef[] } {
	type Match = { index: number, trigger: string, fullMatch: string, value: string }
	const allMatches: Match[] = []
	for (const trigger of Object.keys(triggerConfig)) {
		const { pattern } = triggerConfig[trigger]
		const re = new RegExp(escapeRegex(trigger) + '(' + pattern.source + ')', 'g')
		for (const m of value.matchAll(re)) {
			const fullMatch = m[0]
			const valuePart = m[1] ?? fullMatch.slice(trigger.length)
			allMatches.push({
				index: m.index ?? 0,
				trigger,
				fullMatch,
				value: valuePart,
			})
		}
	}
	allMatches.sort((a, b) => a.index - b.index)
	const refs: EntityRef[] = allMatches.map(({ trigger, value: v }) => {
		const ref = triggerConfig[trigger].buildRef(v)
		return { ...ref, trigger }
	})
	const segments: string[] = []
	let lastEnd = 0
	for (const { index, fullMatch } of allMatches) {
		segments.push(value.slice(lastEnd, index))
		lastEnd = index + fullMatch.length
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
