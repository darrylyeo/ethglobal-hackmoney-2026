<script lang="ts">
	// Types/constants
	import { APP_NAME } from '$/constants/app.ts'
	import { DataSource } from '$/constants/data-sources.ts'


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import LocalGraphScene from '$/components/LocalGraphScene.svelte'


	// Functions
	import {
		buildSessionHash,
		deleteTransactionSession,
	} from '$/lib/session/sessions.ts'

	import type { SessionAction } from '$/data/TransactionSession.ts'

	const actionLabel = (action: string) =>
		action.length > 0
			? `${action[0].toUpperCase()}${action.slice(1)}`
			: 'Session'
	const sessionTitle = (session: { id: string; actions: SessionAction[] }) =>
		`${actionLabel(session.actions[0]?.type ?? '')} ${session.id.slice(0, 6)}`
	const sessionHref = (session: { id: string }) =>
		`/session${buildSessionHash(session.id)}`


	// State
	import { sessionsCollection } from '$/collections/Sessions.ts'

	const sessionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sessionsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
		[],
	)
	const liveQueryEntries = [
		{ id: 'sessions-list', label: 'Sessions', query: sessionsQuery },
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)


	// (Derived)
	const sessions = $derived(
		(sessionsQuery.data ?? [])
			.map((result) => result.row)
			.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
	)
	const formatSessionDate = (ms: number | undefined) =>
		ms ? new Date(ms).toLocaleString() : '—'
</script>


<svelte:head>
	<title>Sessions – {APP_NAME}</title>
</svelte:head>


<main
	id="main"
	data-column
	data-sticky-container
>
	<section
		data-scroll-item
		data-column="gap-3"
	>
		<h1>Sessions</h1>
		{#if sessions.length === 0}
			<p data-muted>No sessions yet.</p>
		{:else}
			<ul data-column="gap-2">
				{#each sessions as session (session.id)}
					<li data-column="gap-0" data-row="gap-2 align-center wrap">
						<span data-row="gap-2 align-center">
							<a href={sessionHref(session)}>{sessionTitle(session)}</a>
							<span data-tag={session.status}>{session.status}</span>
						</span>
						<small data-muted>
							Created {formatSessionDate(session.createdAt)} · Updated {formatSessionDate(session.updatedAt)}
						</small>
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
	<section data-scroll-item>
		<LocalGraphScene />
	</section>
</main>
