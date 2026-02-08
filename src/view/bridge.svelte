<script lang="ts">
	// Types/constants
	import type { Session } from '$/data/Session.ts'
	import { createAction } from '$/data/Session.ts'
	import { ActionType } from '$/constants/actions.ts'
	import {
		createSessionId,
		createSessionWithId,
		getSession,
	} from '$/lib/session/sessions.ts'


	// State
	let session = $state<Session>(
		(() => {
			const id = createSessionId()
			createSessionWithId(id, {
				actions: [createAction(ActionType.Bridge)],
			})
			return getSession(id)!
		})(),
	)


	// Components
	import Session from '$/routes/session/Session.svelte'
</script>


<Session bind:session />
