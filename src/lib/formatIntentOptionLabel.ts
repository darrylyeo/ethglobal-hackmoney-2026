import type { ProtocolAction } from '$/constants/protocolActions.ts'
import { actionTypeDefinitionByActionType } from '$/constants/actions.ts'
import { protocolsById } from '$/constants/protocols.ts'

export const formatIntentOptionLabel = (
	protocolActionsList: readonly ProtocolAction[],
) => (
	protocolActionsList.length === 0 ?
		''
	: protocolActionsList.length === 1 ?
		`${actionTypeDefinitionByActionType[protocolActionsList[0].id.actionType].label} via ${protocolsById[protocolActionsList[0].id.protocol].label}`
	: protocolActionsList.every(
			(pa) => pa.id.protocol === protocolActionsList[0].id.protocol,
		) ?
		(
			protocolActionsList
				.map((pa, i) => (
					i === 0 ?
						actionTypeDefinitionByActionType[pa.id.actionType].label
					:
						actionTypeDefinitionByActionType[pa.id.actionType].label.toLowerCase()
				))
				.join(' then ')
			+ ` via ${protocolsById[protocolActionsList[0].id.protocol].label}`
		)
	:
		new Intl.ListFormat('en', { type: 'unit', style: 'long' })
			.format(
				protocolActionsList.map((pa, i) =>
					(
						(i === 0 ?
							actionTypeDefinitionByActionType[pa.id.actionType].label
						:
							actionTypeDefinitionByActionType[pa.id.actionType].label.toLowerCase())
						+ ` via ${protocolsById[pa.id.protocol].label}`
					)
				),
			)
	)
