/**
 * Live query shared state: tracks a stack of reactive TanStack DB queries.
 * Components register queries via attachments for visualization.
 */

import { untrack } from 'svelte'
import { createAttachmentKey, type Attachment } from 'svelte/attachments'

export type LiveQueryEntry = {
	id: string
	label: string
	query: { data: { row: unknown }[] | undefined }
}

type LiveQueryRegistryEntry = {
	id: string
	entries: LiveQueryEntry[]
}

class LiveQueryContextState {
	registry: LiveQueryRegistryEntry[] = $state([])
	stack: LiveQueryEntry[] = $state([])
}

export type LiveQueryContext = LiveQueryContextState

const createLiveQueryContext = () => new LiveQueryContextState()

const globalLiveQueryContext = createLiveQueryContext()
const localLiveQueryContext = createLiveQueryContext()

export const useLiveQueryContext = () => globalLiveQueryContext

export const useLocalLiveQueryContext = () => localLiveQueryContext

const syncStack = (ctx: LiveQueryContext) => {
	ctx.stack = untrack(() => ctx.registry).flatMap((entry) => entry.entries)
}

const updateRegistry = (
	ctx: LiveQueryContext,
	id: string,
	entries: LiveQueryEntry[],
) => {
	ctx.registry = [
		...untrack(() => ctx.registry).filter((entry) => entry.id !== id),
		{
			id,
			entries,
		},
	]
	syncStack(ctx)
}

const removeRegistry = (ctx: LiveQueryContext, id: string) => {
	ctx.registry = untrack(() => ctx.registry).filter((entry) => entry.id !== id)
	syncStack(ctx)
}

/**
 * Creates an attachment that registers a live query to the global stack.
 * Query is registered when element mounts, unregistered on unmount.
 */
const createLiveQueryAttachment = (
	ctx: LiveQueryContext,
	entry: LiveQueryEntry,
): Attachment => {
	return () => {
		updateRegistry(ctx, entry.id, [entry])

		return () => {
			removeRegistry(ctx, entry.id)
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
		const id = crypto.randomUUID()
		const destroy = $effect.root(() => {
			$effect(() => {
				updateRegistry(ctx, id, getEntries())
				return () => {
					removeRegistry(ctx, id)
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
				updateRegistry(ctx, entry.id, [entry])

				return () => {
					removeRegistry(ctx, entry.id)
				}
			},
		]),
	)
}

export const liveQueryProps = (entries: LiveQueryEntry[]) =>
	createLiveQueryProps(useLiveQueryContext(), entries)

export const liveQueryLocalProps = (entries: LiveQueryEntry[]) =>
	createLiveQueryProps(useLocalLiveQueryContext(), entries)
