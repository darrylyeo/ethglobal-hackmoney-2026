/**
 * Live query context: tracks a stack of reactive TanStack DB queries.
 * Components register queries via attachments for visualization.
 */

import { getContext, hasContext, setContext } from 'svelte'
import { createAttachmentKey, type Attachment } from 'svelte/attachments'

export const LIVE_QUERY_CONTEXT_KEY = 'live-query-stack'

export type LiveQueryEntry = {
	id: string
	label: string
	query: { data: { row: unknown }[] | undefined }
}

class LiveQueryContextState {
	stack: LiveQueryEntry[] =
		$state([])
}

export type LiveQueryContext = LiveQueryContextState

const createLiveQueryContext = () => (
	new LiveQueryContextState()
)

export const useLiveQueryContext = () => (
	hasContext(LIVE_QUERY_CONTEXT_KEY)
		? getContext<LiveQueryContext>(LIVE_QUERY_CONTEXT_KEY)
		: setContext(LIVE_QUERY_CONTEXT_KEY, createLiveQueryContext())
)

/**
 * Creates an attachment that registers a live query to the global stack.
 * Query is registered when element mounts, unregistered on unmount.
 */
export const liveQueryAttachment = (
	entry: LiveQueryEntry,
): Attachment => {
	const ctx = useLiveQueryContext()

	return () => {
		ctx.stack.push(entry)

		return () => {
			const idx = ctx.stack.findIndex((e) => e.id === entry.id)
			if (idx !== -1) ctx.stack.splice(idx, 1)
		}
	}
}

/**
 * Creates props with attachment keys for spreading onto an element.
 * Allows registering multiple queries at once.
 */
export const liveQueryProps = (
	entries: LiveQueryEntry[],
) => {
	const ctx = useLiveQueryContext()

	return Object.fromEntries(
		entries.map((entry) => [
			createAttachmentKey(),
			() => {
				ctx.stack.push(entry)

				return () => {
					const idx = ctx.stack.findIndex((e) => e.id === entry.id)
					if (idx !== -1) ctx.stack.splice(idx, 1)
				}
			},
		]),
	)
}
