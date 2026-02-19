/**
 * Social post session URL parsing. No collection imports (localStorage).
 * Protocol: Farcaster.
 */
import {
	createSocialPostAction,
	SocialPostActionType,
	validSocialPostActionTypes,
	socialPostActionTypeDefinitionByType,
	type SocialPostAction,
} from '$/constants/social-post-actions.ts'
import { SocialProtocol } from '$/constants/social-post-actions.ts'
import type { SocialPostSession } from '$/data/SocialPostSession.ts'
import { SocialPostSessionStatus } from '$/data/SocialPostSession.ts'
import { parse } from 'devalue'

export type SocialPostSessionHashResult =
	| { kind: 'empty' }
	| {
			kind: 'actions'
			actions: {
				action: SocialPostActionType
				params: Record<string, unknown> | null
			}[]
	  }

export type SocialPostSessionInput = {
	template: string | null
	session: SocialPostSession | null
}

const createEphemeralId = () =>
	globalThis.crypto?.randomUUID?.() ??
	`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const toPascalAction = (raw: string): string =>
	raw.charAt(0).toUpperCase() + raw.slice(1)

export const parseSocialPostTemplateParam = (
	template: string | null,
): SocialPostSessionHashResult => {
	if (!template || !validSocialPostActionTypes.has(template as SocialPostActionType))
		return { kind: 'empty' }
	return {
		kind: 'actions',
		actions: [{ action: template as SocialPostActionType, params: null }],
	}
}

const socialPostSessionFromParsed = (
	parsed: SocialPostSessionHashResult,
	protocol: SocialProtocol,
	authorId: number,
): SocialPostSession => {
	const now = Date.now()
	const raw =
		parsed.kind === 'empty'
			? [createSocialPostAction(SocialPostActionType.CreatePost)]
			: parsed.kind === 'actions'
				? parsed.actions.map((a) =>
						createSocialPostAction(
							a.action,
							(a.params ?? undefined) as Record<string, unknown>,
						),
					)
				: [createSocialPostAction(SocialPostActionType.CreatePost)]
	const actions = raw as SocialPostAction[]
	const firstParams = actions[0]?.params ?? {}
	return {
		id: `ephemeral-${createEphemeralId()}`,
		name: undefined,
		actions,
		status: SocialPostSessionStatus.Draft,
		protocol,
		authorId,
		createdAt: now,
		updatedAt: now,
		params: { ...firstParams },
	}
}

export const getSocialPostSessionInputFromUrl = (
	url: URL,
	protocol: SocialProtocol,
	authorId: number,
): SocialPostSessionInput => {
	const sessionParam = url.searchParams.get('session')
	let session: SocialPostSession | null = null
	if (sessionParam) {
		try {
			const parsed = parse(decodeURIComponent(sessionParam)) as SocialPostSession
			if (parsed?.actions?.length) {
				session = {
					...parsed,
					id: `ephemeral-${createEphemeralId()}`,
					status: SocialPostSessionStatus.Draft,
					createdAt: Date.now(),
					updatedAt: Date.now(),
					protocol: parsed.protocol ?? protocol,
					authorId: parsed.authorId ?? authorId,
				}
			}
		} catch {
			//
		}
	}
	if (session) return { template: null, session }
	const templateParam = url.searchParams.get('template')
	const template =
		templateParam && validSocialPostActionTypes.has(templateParam as SocialPostActionType)
			? templateParam
			: templateParam
				? (toPascalAction(templateParam) as SocialPostActionType)
				: null
	const parsed = template ? parseSocialPostTemplateParam(template) : { kind: 'empty' as const }
	const base = socialPostSessionFromParsed(parsed, protocol, authorId)
	return {
		template: template ?? '',
		session: base,
	}
}

export const formatSocialPostSessionPlaceholderName = (
	actions: SocialPostAction[],
): string => {
	const labels = actions
		.map((a) => (socialPostActionTypeDefinitionByType as Record<string, { label: string }>)[a.type]?.label)
		.filter(Boolean) as string[]
	return labels.length > 0 ? labels.join(' → ') : 'Post'
}

export const buildSocialPostSessionPath = (id: string) => `/farcaster/session/${id}`

export const socialPostSessionFromInput = (
	input: SocialPostSessionInput,
): SocialPostSession | null => input.session
