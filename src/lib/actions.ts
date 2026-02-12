/**
 * Action creation and param merging. Constants and types in constants/actions.ts.
 */

import {
	actionTypeDefinitionByActionType,
	type ActionParams,
	type ActionType,
} from '$/constants/actions.ts'

export const createAction = <_ActionType extends ActionType>(
	type: _ActionType,
	params?: Partial<ActionParams<_ActionType>>,
) => ({
	type,
	params: {
		...actionTypeDefinitionByActionType[type].getDefaultParams(),
		...params
	} as ActionParams<_ActionType>,
})

export const mergeActionParams = <_ActionType extends ActionType>(
	action: { type: _ActionType; params: ActionParams<_ActionType> },
) => ({
	...action,
	params: {
		...actionTypeDefinitionByActionType[action.type].getDefaultParams(),
		...action.params
	} as ActionParams<_ActionType>,
})
