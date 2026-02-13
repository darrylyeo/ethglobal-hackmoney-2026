// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
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
