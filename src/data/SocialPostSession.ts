import type { SocialPostAction } from '$/constants/social-post-actions.ts'
import type { SocialProtocol } from '$/constants/social-post-actions.ts'

export enum SocialPostSessionStatus {
	Draft = 'Draft',
	Submitted = 'Submitted',
	Finalized = 'Finalized',
}

export type SocialPostSession$Id = { id: string }

export type SocialPostSession = {
	$id: SocialPostSession$Id
	name?: string
	actions: SocialPostAction[]
	status: SocialPostSessionStatus
	protocol: SocialProtocol
	authorId: number
	createdAt: number
	updatedAt: number
	lockedAt?: number
	params: Record<string, unknown>
	execution?: {
		submittedAt: number
		postHash?: `0x${string}`
	}
	finalization?: {
		at: number
		postId?: unknown
	}
}
