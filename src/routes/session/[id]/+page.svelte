<script lang="ts">
	// Types/constants
	import type { Session } from '$/data/Session.ts'
	import { APP_NAME } from '$/constants/app.ts'
	import {
		ActionType,
		createAction,
		mergeActionParams,
	} from '$/constants/actions.ts'
	import { sessionActionsCollection } from '$/collections/SessionActions.ts'
	import { sessionsCollection } from '$/collections/Sessions.ts'
	import {
		formatSessionPlaceholderName,
		setSessionActions,
	} from '$/lib/session/sessions.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { stringify } from 'devalue'


	// Context
	import { page } from '$app/state'


	// (Derived)
	const sessionId = $derived(page.params.id ?? '')


	// Context
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


	// (Derived)
	const dbSession = $derived(sessionQuery.data?.[0]?.row ?? null)
	const sessionQueryResolved = $derived(sessionQuery.data !== undefined)
	const sessionActionsRows = $derived(
		(sessionActionsQuery.data?.map((d) => d.row) ?? []).sort(
			(a, b) => a.indexInSequence - b.indexInSequence,
		),
	)
	const mergedActions = $derived(
		sessionActionsRows.length > 0
			? sessionActionsRows.map((r) => r.action)
			: dbSession?.actions ?? [],
	)
	const sessionFromDb = $derived.by(() => {
		if (!dbSession) return null
		const actions = mergedActions.map((a) => mergeActionParams(a))
		return {
			...dbSession,
			actions:
				actions.length > 0 ? actions : [createAction(ActionType.Swap)],
		}
	})


	// State
	let activeSession = $state<Session | null>(null)
	let lastActionsHash = $state('')


	// Actions
	$effect(() => {
		const next = sessionFromDb
		if (!next) return
		if (
			stringify(activeSession?.actions) !== stringify(next.actions) ||
			activeSession?.updatedAt !== next.updatedAt
		) {
			activeSession = next
		}
		lastActionsHash = stringify(activeSession?.actions ?? [])
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


	// (Derived)
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
			<p data-text="muted">Session not found.</p>
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
			<p data-text="muted">Loading session…</p>
		</section>
	{/if}
</main>
