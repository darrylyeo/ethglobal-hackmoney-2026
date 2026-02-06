<script lang="ts">


	// Types/constants
	import { DataSource } from '$/constants/data-sources'


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'


	// Functions
	import {
		buildSessionHash,
		deleteTransactionSession,
	} from '$/lib/transaction-sessions'

	const actionLabel = (action: string) =>
		action.length > 0
			? `${action[0].toUpperCase()}${action.slice(1)}`
			: 'Session'
	const sessionTitle = (session: { id: string; actions: string[] }) =>
		`${actionLabel(session.actions[0] ?? '')} ${session.id.slice(0, 6)}`
	const sessionHref = (session: { id: string; actions: string[] }) =>
		`/session${buildSessionHash(session.id)}`


	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'

	const sessionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
		[],
	)
	const liveQueryEntries = [
		{ id: 'sessions-list', label: 'Sessions', query: sessionsQuery },
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const sessions = $derived(
		(sessionsQuery.data ?? [])
			.map((result) => result.row)
			.sort((a, b) => b.updatedAt - a.updatedAt),
	)
</script>


<svelte:head>
	<title>Sessions – USDC Tools</title>
</svelte:head>


<main id="main" data-column data-sticky-container>
	<section data-scroll-item data-column="gap-3">
		<h1>Sessions</h1>
		{#if sessions.length === 0}
			<p data-muted>No sessions yet.</p>
		{:else}
			<ul data-column="gap-2">
				{#each sessions as session (session.id)}
					<li data-row="gap-2 align-center">
						<a href={sessionHref(session)}>{sessionTitle(session)}</a>
						<span data-tag={session.status}>{session.status}</span>
						<button
							type="button"
							aria-label="Delete session"
							onclick={() => deleteTransactionSession(session.id)}
						>
							Delete
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
