<script lang="ts">
	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import LiveQueryScope from '$/components/LiveQueryScope.svelte'

	// Functions
	import { buildSessionHash } from '$/lib/transaction-sessions'

	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'

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
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)

	$effect(() => {
		if (!session) return
		goto(`/session${buildSessionHash(session.id)}`, {
			replaceState: true,
		})
	})
</script>

<svelte:head>
	<title>Session – USDC Tools</title>
</svelte:head>

<LiveQueryScope entries={liveQueryEntries}>
	<main id="main" data-column data-sticky-container>
		<section data-scroll-item>
			{#if session}
				<p data-muted>Redirecting to session…</p>
			{:else}
				<p data-muted>Session not found.</p>
				<a href="/sessions">Back to sessions</a>
			{/if}
		</section>
	</main>
</LiveQueryScope>
