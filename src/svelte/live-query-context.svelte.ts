/**
 * Live query shared state: tracks a stack of reactive TanStack DB queries.
 * Components register queries via $effect for visualization.
 */

import { untrack } from 'svelte'

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
) => registerLiveQueryStack(useLiveQueryContext(), getEntries)

export const registerLocalLiveQueryStack = (
	getEntries: () => LiveQueryEntry[],
) => registerLiveQueryStack(useLocalLiveQueryContext(), getEntries)
