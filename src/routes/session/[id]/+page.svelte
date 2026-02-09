<script lang="ts">
	// Types/constants
	import { APP_NAME } from '$/constants/app.ts'


	// Context
	import { page } from '$app/state'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { stringify } from 'devalue'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Functions
	import {
		createAction,
		mergeActionParams,
	} from '$/constants/actions.ts'
	import { ActionType } from '$/constants/actions.ts'
	import type { Session } from '$/data/Session.ts'
	import { formatSessionPlaceholderName } from '$/lib/session/sessions.ts'
	import { setSessionActions } from '$/lib/session/sessions.ts'


	// State
	import { sessionActionsCollection } from '$/collections/SessionActions.ts'
	import { sessionsCollection } from '$/collections/Sessions.ts'

	const sessionId = $derived(page.params.id ?? '')
	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sessionsCollection })
				.where(({ row }) => eq(row.id, sessionId))
				.select(({ row }) => ({ row })),
		[() => sessionId],
	)
	const sessionActionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sessionActionsCollection })
				.where(({ row }) => eq(row.sessionId, sessionId))
				.select(({ row }) => ({ row })),
		[() => sessionId],
	)
	const liveQueryEntries = [
		{
			id: 'session-by-id-session',
			label: 'Session',
			query: sessionQuery,
		},
		{
			id: 'session-by-id-actions',
			label: 'Session actions',
			query: sessionActionsQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const dbSession = $derived(sessionQuery.data?.[0]?.row ?? null)
	const sessionQueryResolved = $derived(sessionQuery.data !== undefined)
	const sessionActionsRows = $derived(
		(sessionActionsQuery.data?.map((d) => d.row) ?? []).sort(
			(a, b) => a.actionIndex - b.actionIndex,
		),
	)
	const mergedActions = $derived(
		sessionActionsRows.length > 0
			? sessionActionsRows.map((r) => r.action)
			: dbSession?.actions ?? [],
	)

	let activeSession = $state<Session | null>(null)
	let lastActionsHash = $state('')
	$effect(() => {
		if (!dbSession) return
		const actions = mergedActions.map((a) => mergeActionParams(a))
		const actionsToUse =
			actions.length > 0 ? actions : [createAction(ActionType.Swap)]
		const next = {
			...dbSession,
			actions: actionsToUse,
		}
		if (
			stringify(activeSession?.actions) !== stringify(next.actions) ||
			activeSession?.updatedAt !== next.updatedAt
		) {
			activeSession = next
		}
		lastActionsHash = stringify(activeSession.actions)
	})

	$effect(() => {
		const s = activeSession
		if (!s) return
		const hash = stringify(s.actions)
		if (hash !== lastActionsHash) {
			lastActionsHash = hash
			setSessionActions(s.id, s.actions)
		}
	})

	const pageTitle = $derived(
		activeSession
			? (activeSession.name ?? formatSessionPlaceholderName(activeSession.actions))
			: 'Session',
	)


	// Components
	import SessionView from '../Session.svelte'
</script>


<svelte:head>
	<title>{pageTitle} – {APP_NAME}</title>
</svelte:head>


<main
	id="main"
	data-column
	data-sticky-container
>
	{#if activeSession}
		<SessionView bind:session={activeSession} />
	{:else if sessionQueryResolved && dbSession === null}
		<section data-scroll-item>
			<p data-muted>Session not found.</p>
			<a href="/sessions">Back to sessions</a>
		</section>
	{:else}
		<section data-scroll-item data-column="gap-3">
			<header data-row="wrap gap-4">
				<div data-row="start gap-2" data-row-item="flexible">
					<h1>Session</h1>
				</div>
				<div data-row="gap-2">
					<span data-text="annotation">Session</span>
				</div>
			</header>
			<p data-muted>Loading session…</p>
		</section>
	{/if}
</main>
