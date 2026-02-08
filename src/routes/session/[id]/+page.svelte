<script lang="ts">
	// Types/constants
	import { APP_NAME } from '$/constants/app.ts'


	// Context
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Functions
	import { buildSessionHash } from '$/lib/session/sessions.ts'


	// State
	import { transactionSessionsCollection } from '$/collections/TransactionSessions.ts'


	// (Derived)
	const sessionId = $derived(page.params.id ?? '')
	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, sessionId))
				.select(({ row }) => ({ row })),
		[() => sessionId],
	)
	const liveQueryEntries = [
		{
			id: 'session-by-id-session',
			label: 'Session',
			query: sessionQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)


	// Actions
	$effect(() => {
		if (!session) return
		goto(`/session${buildSessionHash(session.id)}`, {
			replaceState: true,
		})
	})
</script>


<svelte:head>
	<title>Session – {APP_NAME}</title>
</svelte:head>


<main
	id="main"
	data-column
	data-sticky-container
>
	<section data-scroll-item>
		{#if session}
			<p data-muted>Redirecting to session…</p>
		{:else}
			<p data-muted>Session not found.</p>
			<a href="/sessions">Back to sessions</a>
		{/if}
	</section>
</main>
