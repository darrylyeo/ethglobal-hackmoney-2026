// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			panelId?: string
			hash?: string | null
			route?: string
		}
		// interface Platform {}
	}
}

declare module '$app/paths' {
	export function resolve(href: string): string
}

export {}
