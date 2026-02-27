import { actionTypeDefinitionByActionType } from '$/constants/actions.ts'
import type { ProtocolAction } from '$/constants/protocolActions.ts'
import { protocolsById } from '$/constants/protocols.ts'

const listFormatUnit = new Intl.ListFormat('en', { type: 'unit', style: 'long' })

export const formatIntentOptionLabel = (
	protocolActionsList: readonly ProtocolAction[],
): string => {
	if (protocolActionsList.length === 0) return ''
	const first = protocolActionsList[0]
	if (protocolActionsList.length === 1)
		return `${actionTypeDefinitionByActionType[first.id.actionType].label} via ${protocolsById[first.id.protocol].label}`
	const sameProtocol = protocolActionsList.every(
		(pa) => pa.id.protocol === first.id.protocol,
	)
	if (sameProtocol)
		return (
			protocolActionsList
				.map((pa, i) => (
					i === 0
						? actionTypeDefinitionByActionType[pa.id.actionType].label
						: actionTypeDefinitionByActionType[pa.id.actionType].label.toLowerCase()
				))
				.join(' then ')
			+ ` via ${protocolsById[first.id.protocol].label}`
		)
	const parts = protocolActionsList.map((pa, i) =>
		(i === 0
			? actionTypeDefinitionByActionType[pa.id.actionType].label
			: actionTypeDefinitionByActionType[pa.id.actionType].label.toLowerCase())
		+ ` via ${protocolsById[pa.id.protocol].label}`,
	)
	return listFormatUnit.format(parts)
}
