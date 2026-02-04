/**
 * Live query context: tracks a stack of reactive TanStack DB queries.
 * Components register queries via attachments for visualization.
 */

import { getContext, hasContext, setContext } from 'svelte'
import { createAttachmentKey, type Attachment } from 'svelte/attachments'

export const LIVE_QUERY_CONTEXT_KEY = 'live-query-stack'
export const LIVE_QUERY_LOCAL_CONTEXT_KEY = 'live-query-stack-local'

export type LiveQueryEntry = {
	id: string
	label: string
	query: { data: { row: unknown }[] | undefined }
}

class LiveQueryContextState {
	stack: LiveQueryEntry[] = $state([])
}

export type LiveQueryContext = LiveQueryContextState

const createLiveQueryContext = () => new LiveQueryContextState()

export const useLiveQueryContext = () =>
	hasContext(LIVE_QUERY_CONTEXT_KEY)
		? getContext<LiveQueryContext>(LIVE_QUERY_CONTEXT_KEY)
		: setContext(LIVE_QUERY_CONTEXT_KEY, createLiveQueryContext())

export const useLocalLiveQueryContext = () =>
	hasContext(LIVE_QUERY_LOCAL_CONTEXT_KEY)
		? getContext<LiveQueryContext>(LIVE_QUERY_LOCAL_CONTEXT_KEY)
		: setContext(LIVE_QUERY_LOCAL_CONTEXT_KEY, createLiveQueryContext())

/**
 * Creates an attachment that registers a live query to the global stack.
 * Query is registered when element mounts, unregistered on unmount.
 */
const createLiveQueryAttachment = (
	ctx: LiveQueryContext,
	entry: LiveQueryEntry,
): Attachment => {
	return () => {
		ctx.stack.push(entry)

		return () => {
			const idx = ctx.stack.findIndex((e) => e.id === entry.id)
			if (idx !== -1) ctx.stack.splice(idx, 1)
		}
	}
}

export const liveQueryAttachment = (entry: LiveQueryEntry): Attachment =>
	createLiveQueryAttachment(useLiveQueryContext(), entry)

export const liveQueryLocalAttachment = (entry: LiveQueryEntry): Attachment =>
	createLiveQueryAttachment(useLocalLiveQueryContext(), entry)

/**
 * Creates an attachment that syncs multiple entries (derived from getEntries) to the stack.
 * Use when a component has several live queries and should register them as one unit.
 */
const createLiveQueryAttachmentFrom = (
	ctx: LiveQueryContext,
	getEntries: () => LiveQueryEntry[],
): Attachment => {
	return () => {
		const destroy = $effect.root(() => {
			$effect(() => {
				const entries = getEntries()
				entries.forEach((e) => ctx.stack.push(e))
				return () => {
					entries.forEach((e) => {
						const idx = ctx.stack.findIndex((x) => x.id === e.id)
						if (idx !== -1) ctx.stack.splice(idx, 1)
					})
				}
			})
		})
		return () => {
			destroy()
		}
	}
}

export const liveQueryAttachmentFrom = (
	getEntries: () => LiveQueryEntry[],
): Attachment =>
	createLiveQueryAttachmentFrom(useLiveQueryContext(), getEntries)

export const liveQueryLocalAttachmentFrom = (
	getEntries: () => LiveQueryEntry[],
): Attachment =>
	createLiveQueryAttachmentFrom(useLocalLiveQueryContext(), getEntries)

/**
 * Creates props with attachment keys for spreading onto an element.
 * Allows registering multiple queries at once.
 */
const createLiveQueryProps = (
	ctx: LiveQueryContext,
	entries: LiveQueryEntry[],
) => {
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

export const liveQueryProps = (entries: LiveQueryEntry[]) =>
	createLiveQueryProps(useLiveQueryContext(), entries)

export const liveQueryLocalProps = (entries: LiveQueryEntry[]) =>
	createLiveQueryProps(useLocalLiveQueryContext(), entries)
