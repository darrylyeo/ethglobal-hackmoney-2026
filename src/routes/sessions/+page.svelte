<script lang="ts">
	// Types/constants
	import { actionTypeDefinitionByActionType } from '$/constants/actions.ts'
	import { APP_NAME } from '$/constants/app.ts'
	import type { Action } from '$/data/Session.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Context
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Functions
	import { formatRelativeTime } from '$/lib/formatRelativeTime.ts'
	import {
		buildSessionPath,
		deleteAllDraftSessions,
		deleteSession,
		formatSessionPlaceholderName,
	} from '$/lib/session/sessions.ts'
	import { SessionStatus } from '$/data/Session.ts'


	// State
	import { sessionsCollection } from '$/collections/Sessions.ts'


	// Components
	import WatchButton from '$/components/WatchButton.svelte'

	const sessionTitle = (session: { name?: string; actions: Action[] }) =>
		session.name ?? formatSessionPlaceholderName(session.actions)
	const sessionIcon = (session: { actions: Action[] }) =>
		(actionTypeDefinitionByActionType as Record<string, { icon: string }>)[
			session.actions[0]?.type
		]?.icon ?? '📋'
	const sessionHref = (session: { id: string }) =>
		buildSessionPath(session.id)

	const sessionsQuery = useLiveQuery(
		(q) =>
			q.from({ row: sessionsCollection }).select(({ row }) => ({ row })),
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
	const draftCount = $derived(
		sessions.filter((s) => s.status === SessionStatus.Draft).length,
	)
	let now = $state(Date.now())
	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 60_000)
		return () => clearInterval(id)
	})
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
		<header data-row="wrap gap-4">
			<div data-row="start gap-2" data-row-item="flexible">
				<h1>Sessions</h1>
			</div>
			{#if draftCount > 0}
				<div data-row="gap-2">
					<button
						type="button"
						onclick={() => deleteAllDraftSessions()}
					>
						Delete all drafts ({draftCount})
					</button>
				</div>
			{/if}
		</header>
		{#if sessions.length === 0}
			<p data-text="muted">No sessions yet.</p>
		{:else}
			<ul
				data-columns="width-5 gap-3"
				data-list="unstyled"
			>
				{#each sessions as session (session.id)}
					<li
						data-columns-item
						data-card="radius-4 padding-4"
					>
						<div data-column="gap-2">
							<div data-row="gap-2 align-center wrap">
								<a
									href={sessionHref(session)}
									data-row-item="flexible"
								>
									<span data-row="gap-2 align-center">
										<span aria-hidden="true">{sessionIcon(session)}</span>
										{sessionTitle(session)}
									</span>
								</a>
								<span data-row="gap-2 align-center">
									<span data-tag>{session.status}</span>
									<WatchButton
										entityType={EntityType.Session}
										entityId={{ id: session.id }}
									/>
									<button
										type="button"
										aria-label="Delete session"
										onclick={() => deleteSession(session.id)}
									>
										Delete
									</button>
								</span>
							</div>
							<p data-text="muted">
								{session.updatedAt != null
									? `Updated ${formatRelativeTime(now - session.updatedAt)}`
									: '—'}
							</p>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
