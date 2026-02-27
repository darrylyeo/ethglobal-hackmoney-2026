import type { EntityRef } from '$/data/EntityRef.ts'
import { EntityType } from '$/data/$EntityType.ts'
import { PatternType, patternsByType } from '$/constants/patterns.ts'

export type EntityRefTriggerConfig = Record<
	string,
	{
		pattern: RegExp,
		buildRef: (value: string) => EntityRef
	}
>

export const entityRefPatternTypes: readonly PatternType[] = [
	PatternType.EvmTransactionHash,
	PatternType.EvmAddress,
	PatternType.EntityId,
	PatternType.EvmBlockNumber,
]

const entityRefPatternTypeToEntityType = {
	[PatternType.EvmAddress]: EntityType.Actor,
	[PatternType.EvmBlockNumber]: EntityType.Block,
	[PatternType.EvmTransactionHash]: EntityType.Transaction,
	[PatternType.EntityId]: EntityType.AgentChatTurn,
} as const satisfies Record<PatternType, EntityType>

const entityRefConfigs = entityRefPatternTypes
	.map((t) => patternsByType[t])
	.sort((a, b) => (b.matchComplexity - a.matchComplexity))

const entityPatternSource = `(?:${entityRefConfigs
	.map((p) => `(?<${p.type}>${p.pattern.source})`)
	.join('|')})`

const entityValuePattern = new RegExp('^(?:' + entityPatternSource + ')$')

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildEntityRefFromGroups = (trigger: string, groups: Record<string, string>) => {
	const matched = entityRefConfigs.find((p) => groups[p.type])
	if (!matched) throw new Error('No matching group')
	const value = groups[matched.type]
	return {
		entityType: entityRefPatternTypeToEntityType[matched.type],
		entityId: value,
		displayLabel: `${trigger}${value}`,
		trigger,
	}
}

export const buildDefaultEntityTriggerConfig = () => ({
	'@': {
		pattern: new RegExp(entityPatternSource),
		buildRef: (value: string) => {
			const m = value.match(entityValuePattern)
			if (!m?.groups)
				return {
					entityType: EntityType.AgentChatTurn,
					entityId: value,
					displayLabel: `@${value}`,
					trigger: '@',
				}
			return buildEntityRefFromGroups('@', m.groups as Record<string, string>)
		},
	},
})

export const parseValueToSegmentsAndRefs = (
	value: string,
	triggerConfig: EntityRefTriggerConfig,
) => {
	const allMatches: { index: number, trigger: string, fullMatch: string, value: string }[] = []
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

export const getValueFromSegmentsAndRefs = (
	segments: string[],
	refs: EntityRef[],
) => {
	if (segments.length !== refs.length + 1) return segments.join('')
	return segments.reduce(
		(acc, seg, i) => (
			i < refs.length ?
				acc + seg + refs[i].displayLabel
			: acc + seg
		),
		'',
	)
}
