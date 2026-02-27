// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface ViewTransition {
		updateCallbackDone: Promise<void>
		ready: Promise<void>
		finished: Promise<void>
		skipTransition: () => void
	}

	interface Document {
		startViewTransition(updateCallback: () => Promise<void>): ViewTransition
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			panelId?: string
			route?: string
			sessionState?:
				| { kind: 'empty' }
				| { kind: 'session'; sessionId: string }
				| {
						kind: 'actions'
						actions: {
							action: string
							params: Record<string, unknown> | null
						}[]
				  }
				| null
		}
		// interface Platform {}
	}
}

declare module '$app/paths' {
	export function resolve(href: string): string
}

export {}
