<script lang="ts">
	// Types/constants
	import { APP_NAME } from '$/constants/app.ts'


	// Context
	import { replaceState } from '$app/navigation'
	import { page } from '$app/state'
	import { setContext } from 'svelte'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { stringify } from 'devalue'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let {
		panelHash,
		setPanelHash,
	}: {
		panelHash?: string | null
		setPanelHash?: (hash: string, replace?: boolean) => void
	} = $props()


	// Functions
	import {
		SessionTemplateId,
		sessionTemplatesById,
		type Session,
	} from '$/data/Session.ts'
	import { formatSessionPlaceholderName } from '$/lib/session/sessions.ts'
	import {
		SESSION_HASH_SOURCE_KEY,
		type SessionHashSource,
	} from '$/lib/session/panelHash.ts'
	import { setEffectiveHash } from '$/lib/session/panelHash.ts'
	import { mergeActionParams } from '$/constants/actions.ts'
	import {
		buildSessionHash,
		createSession,
		parseSessionHash,
		parseTemplateParam,
		sessionFromParsedHash,
		setSessionActions,
	} from '$/lib/session/sessions.ts'


	// State
	import { sessionActionsCollection } from '$/collections/SessionActions.ts'
	import { sessionsCollection } from '$/collections/Sessions.ts'

	const hashSource = $state<SessionHashSource>({
		enabled: false,
		panelHash: null,
		setPanelHash: () => {},
	})
	$effect(() => {
		if (typeof setPanelHash === 'function') {
			hashSource.enabled = true
			hashSource.panelHash = panelHash ?? null
			hashSource.setPanelHash = setPanelHash
			return
		}
		hashSource.enabled = false
		hashSource.panelHash = null
		hashSource.setPanelHash = () => {}
	})
	setContext(SESSION_HASH_SOURCE_KEY, hashSource)

	let activeSession = $state<Session | null>(null)
	let lastEphemeralHash = $state<string | null>(null)


	// (Derived)
	const effectiveHash = $derived(
		hashSource.enabled ? (hashSource.panelHash ?? '') : page.url.hash,
	)
	const templateParam = $derived(page.url.searchParams.get('template'))
	const parsedFromHash = $derived(parseSessionHash(effectiveHash))
	const parsedHash = $derived(
		templateParam && templateParam.length > 0
			? parseTemplateParam(templateParam)
			: parsedFromHash,
	)
	const activeSessionId = $derived(
		parsedFromHash.kind === 'session' ? parsedFromHash.sessionId : null,
	)

	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sessionsCollection })
				.where(({ row }) => eq(row.id, activeSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[() => activeSessionId],
	)
	const sessionActionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sessionActionsCollection })
				.where(({ row }) => eq(row.sessionId, activeSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[() => activeSessionId],
	)
	const liveQueryEntries = [
		{ id: 'session-page-session', label: 'Session', query: sessionQuery },
		{
			id: 'session-page-actions',
			label: 'Session actions',
			query: sessionActionsQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const dbSession = $derived(sessionQuery.data?.[0]?.row ?? null)
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

	const effectiveEphemeralKey = $derived(templateParam ?? effectiveHash)
	let lastActionsHash = $state('')
	$effect(() => {
		if (parsedFromHash.kind === 'session' && dbSession) {
			const actions = mergedActions.map((a) => mergeActionParams(a))
			const sameAsCurrent =
				activeSession != null &&
				activeSession.actions.length === actions.length &&
				stringify(activeSession.actions) === stringify(actions)
			const actionsToUse =
				(sameAsCurrent && activeSession ? activeSession.actions : actions)
			activeSession = {
				...dbSession,
				actions: actionsToUse,
			}
			lastActionsHash = stringify(activeSession.actions)
			lastEphemeralHash = null
			return
		}
		if (
			(parsedHash.kind === 'actions' || parsedHash.kind === 'empty') &&
			effectiveEphemeralKey !== lastEphemeralHash
		) {
			const base = sessionFromParsedHash(parsedHash)
			const templateId = templateParam as SessionTemplateId | undefined
			const template = templateId && sessionTemplatesById[templateId]
			activeSession = template
				? {
						...base,
						actions: template.actions.map((a) => ({
							...a,
							params: { ...a.params },
						})),
					}
				: base
			lastEphemeralHash = effectiveEphemeralKey
		}
	})

	$effect(() => {
		const s = activeSession
		if (!s || s.id.startsWith('ephemeral-')) return
		const hash = stringify(s.actions)
		if (hash !== lastActionsHash) {
			lastActionsHash = hash
			setSessionActions(s.id, s.actions)
		}
	})

	const isEphemeral = $derived(
		parsedHash.kind === 'actions' || parsedHash.kind === 'empty',
	)

	const persistEphemeralSession = () => {
		if (!activeSession || !activeSession.id.startsWith('ephemeral-')) return
		const created = createSession({
			actions: activeSession.actions,
			name: activeSession.name,
			params: activeSession.params,
		})
		setEffectiveHash(hashSource, buildSessionHash(created.id))
		replaceState(
			`/session${buildSessionHash(created.id)}`,
			{},
		)
	}

	const pageTitle = $derived(
		activeSession
			? (activeSession.name ?? formatSessionPlaceholderName(activeSession.actions))
			: 'Session',
	)


	// Components
	import SessionView from './Session.svelte'
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
		<SessionView
			bind:session={activeSession}
			onPersist={isEphemeral ? persistEphemeralSession : undefined}
		/>
	{:else}
		<section
			data-scroll-item
			data-column="gap-3"
		>
			<header data-row="wrap gap-4 align-center">
				<h1>Session</h1>
				<span data-text="annotation">Session</span>
			</header>
			<p data-muted>Loading session…</p>
		</section>
	{/if}
</main>
