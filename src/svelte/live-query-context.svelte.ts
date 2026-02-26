/**
 * Live query shared state: tracks a stack of reactive TanStack DB queries.
 * Components register queries via $effect for visualization.
 * Root layout must provide context via setGlobalLiveQueryContext / setLocalLiveQueryContext.
 */

import { getContext, setContext, untrack } from 'svelte'

export type LiveQueryEntry = {
	id: string
	label: string
	query: { data: Record<string, unknown>[] | undefined }
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

const GLOBAL_LIVE_QUERY_KEY = Symbol('global-live-query')
const LOCAL_LIVE_QUERY_KEY = Symbol('local-live-query')

export const createLiveQueryContext = () => new LiveQueryContextState()

export const setGlobalLiveQueryContext = (ctx: LiveQueryContext) =>
	setContext(GLOBAL_LIVE_QUERY_KEY, ctx)

export const setLocalLiveQueryContext = (ctx: LiveQueryContext) =>
	setContext(LOCAL_LIVE_QUERY_KEY, ctx)

export const useGlobalQueries = (): LiveQueryContext =>
	getContext<LiveQueryContext>(GLOBAL_LIVE_QUERY_KEY)

export const useLocalQueries = (): LiveQueryContext =>
	getContext<LiveQueryContext>(LOCAL_LIVE_QUERY_KEY)

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
 * Registers a live query stack for visualization via $effect.
 * Call once per component in the <script> block; the stack updates
 * reactively and cleans up on component teardown.
 */
const registerLiveQueryStack = (
	ctx: LiveQueryContext,
	getEntries: () => LiveQueryEntry[],
) => {
	const id = crypto.randomUUID()
	$effect(() => {
		updateRegistry(ctx, id, getEntries())
		return () => removeRegistry(ctx, id)
	})
}

export const registerGlobalLiveQueryStack = (
	getEntries: () => LiveQueryEntry[],
) => registerLiveQueryStack(useGlobalQueries(), getEntries)

export const registerLocalLiveQueryStack = (
	getEntries: () => LiveQueryEntry[],
) => registerLiveQueryStack(useLocalQueries(), getEntries)
