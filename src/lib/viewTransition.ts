import { tick } from 'svelte'

type ViewTransitionHandle = {
	skipTransition: () => void
	finished: Promise<void>
}
type DocumentWithViewTransitions = Document & {
	startViewTransition: (cb: () => void | Promise<void>) => ViewTransitionHandle
}

const activeByScopeId = new Map<string, ViewTransitionHandle>()

/**
 * Returns a runner that applies updates inside the View Transitions API.
 * When run again before the previous transition finishes, the previous one is skipped.
 * - No `id`: only this runner's transitions cancel each other (one runner per scope).
 * - With `id`: any runner with the same id skips the current transition for that id, so transitions in the same group cancel each other; different ids do not.
 * Note: the browser only allows one active transition at a time, so starting a transition still ends any other active one globally.
 */
export const createViewTransition = (scopeId?: string): {
	schedule: (update: () => void | Promise<void>) => void
} => {
	let current: ViewTransitionHandle | null = null
	const schedule = (update: () => void | Promise<void>) => {
		const runUpdate = async () => {
			await update()
			await tick()
		}
		if (typeof document !== 'undefined' && 'startViewTransition' in document) {
			const outgoing = scopeId ? activeByScopeId.get(scopeId) : current
			if (outgoing) outgoing.skipTransition()
			current = (document as DocumentWithViewTransitions).startViewTransition(runUpdate)
			if (scopeId) activeByScopeId.set(scopeId, current)
			current.finished.finally(() => {
				if (scopeId && activeByScopeId.get(scopeId) === current) activeByScopeId.delete(scopeId)
				current = null
			})
			current.finished.catch(() => {})
		}
		else void runUpdate()
	}
	return { schedule }
}
