<script lang="ts">


	// Types/constants
	import type { TransactionSession } from '$/data/TransactionSession.ts'
	import { createSessionAction } from '$/data/TransactionSession.ts'
	import { ActionType } from '$/constants/intents.ts'
	import {
		createSessionId,
		createTransactionSessionWithId,
		getTransactionSession,
	} from '$/lib/session/sessions.ts'


	// State
	let session = $state<TransactionSession>(
		(() => {
			const id = createSessionId()
			createTransactionSessionWithId(id, {
				actions: [createSessionAction(ActionType.Bridge)],
			})
			return getTransactionSession(id)!
		})(),
	)


	// Components
	import Session from '$/routes/session/Session.svelte'
</script>


<Session bind:session />
