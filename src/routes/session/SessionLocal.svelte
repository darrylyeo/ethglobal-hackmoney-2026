<script lang="ts">
	// Types/constants
	import type { Session } from '$/data/Session.ts'


	// Context
	import { replaceState } from '$app/navigation'


	// Functions
	import { buildSessionPath, createSession } from '$/lib/session/sessions.ts'


	// Props
	let {
		initialSession,
		setPanelRoute,
	}: {
		initialSession: Session
		setPanelRoute?: (path: string, params: Record<string, string>) => void
	} = $props()


	// State — {#key urlKey} remounts on input change, so initialSession is stable
	// svelte-ignore state_referenced_locally — intentional: we only seed from initial
	let activeSession = $state<Session>(structuredClone(initialSession))


	// (Derived)
	const isEphemeral = $derived(activeSession.id.startsWith('ephemeral-'))

	const persistSession = () => {
		if (!isEphemeral) return
		const created = createSession({
			actions: activeSession.actions,
			name: activeSession.name,
			params: activeSession.params,
		})
		if (setPanelRoute) {
			setPanelRoute('/session/[id]', { id: created.id })
		} else {
			replaceState(buildSessionPath(created.id), {})
		}
	}


	// Components
	import SessionView from './Session.svelte'
</script>


<SessionView
	bind:session={activeSession}
	onPersist={isEphemeral ? persistSession : undefined}
/>
