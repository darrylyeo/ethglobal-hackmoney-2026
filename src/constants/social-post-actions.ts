import { type } from 'arktype'

export enum SocialProtocol {
	Farcaster = 'Farcaster',
}

export type SocialPostActionTypeDefinition<_Schema extends { infer: unknown } = { infer: Record<string, unknown> }> =
	{
		type: SocialPostActionType
		label: string
		icon: string
		params: _Schema
		getDefaultParams: () => _Schema['infer']
	}

export enum SocialPostActionType {
	CreatePost = 'CreatePost',
	ReplyToPost = 'ReplyToPost',
}

export const socialPostActionTypeDefinitions = [
	{
		type: SocialPostActionType.CreatePost,
		label: 'Create post',
		icon: '✍️',
		params: type({
			text: type('string').default(''),
			parentUrl: type('string').optional(),
		}),
	},
	{
		type: SocialPostActionType.ReplyToPost,
		label: 'Reply to post',
		icon: '↩️',
		params: type({
			text: type('string').default(''),
			parentFid: type('number.integer').default(0),
			parentHash: type('string').default(''),
			parentUrl: type('string').optional(),
		}),
	},
] as const satisfies readonly {
	type: SocialPostActionType
	label: string
	icon: string
	params: { infer: unknown; assert: (input: unknown) => unknown }
}[]

const withGetDefaultParams = socialPostActionTypeDefinitions.map((d) => ({
	...d,
	getDefaultParams: () => d.params.assert({}) as (typeof d.params)['infer'],
}))

export const socialPostActionTypeDefinitionByType = Object.fromEntries(
	withGetDefaultParams.map((d) => [d.type, d]),
) as Record<SocialPostActionType, (typeof withGetDefaultParams)[number]>

export const socialPostActionTypes = withGetDefaultParams

type _DefinitionFor<T extends SocialPostActionType> = Extract<
	(typeof withGetDefaultParams)[number],
	{ type: T }
>
export type SocialPostActionParams<_ActionType extends SocialPostActionType> =
	ReturnType<_DefinitionFor<_ActionType>['getDefaultParams']>

export type SocialPostAction<_ActionType extends SocialPostActionType = SocialPostActionType> =
	{
		type: _ActionType
		params: SocialPostActionParams<_ActionType>
	}

export const createSocialPostAction = <_ActionType extends SocialPostActionType>(
	type: _ActionType,
	params?: Partial<SocialPostActionParams<_ActionType>>,
): SocialPostAction<_ActionType> => ({
	type,
	params: {
		...socialPostActionTypeDefinitionByType[type].getDefaultParams(),
		...(params ?? {}),
	} as SocialPostActionParams<_ActionType>,
})

export const validSocialPostActionTypes = new Set(
	socialPostActionTypeDefinitions.map((d) => d.type),
)
