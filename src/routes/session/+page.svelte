<script lang="ts">
	// Context
	import { page } from '$app/state'
	import { setContext } from 'svelte'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let {
		panelHash,
		setPanelHash,
	}: {
		panelHash?: string | null,
		setPanelHash?: (hash: string, replace?: boolean) => void,
	} = $props()


	// Functions
	import { ActionType } from '$/constants/intents.ts'
	import type { TransactionSession } from '$/data/TransactionSession.ts'
	import {
		createSessionAction,
		sessionActionType,
		toSessionAction,
	} from '$/data/TransactionSession.ts'
	import { specForAction } from '$/lib/intents.ts'
	import {
		SESSION_HASH_SOURCE_KEY,
		type SessionHashSource,
	} from '$/lib/session/panelHash.ts'
	import {
		buildSessionHash,
		createTransactionSession,
		parseSessionHash,
	} from '$/lib/session/sessions.ts'


	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions.ts'

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

	let activeSession = $state<TransactionSession | null>(null)


	// (Derived)
	const effectiveHash = $derived(
		hashSource.enabled ? (hashSource.panelHash ?? '') : page.url.hash,
	)
	const parsedHash = $derived(parseSessionHash(effectiveHash))
	const activeSessionId = $derived(
		parsedHash.kind === 'session' ? parsedHash.sessionId : null,
	)

	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, activeSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[() => activeSessionId],
	)
	const liveQueryEntries = [
		{
			id: 'session-page-session',
			label: 'Session',
			query: sessionQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const dbSession = $derived(sessionQuery.data?.[0]?.row ?? null)

	$effect(() => {
		if (dbSession) {
			activeSession = dbSession
			return
		}

		if (parsedHash.kind === 'actions') {
			const created = createTransactionSession({
				actions: parsedHash.actions.map((a) => toSessionAction(a.action)),
				params: parsedHash.actions[0]?.params ?? {},
			})
			activeSession = created
			return
		}

		if (parsedHash.kind === 'empty') {
			const created = createTransactionSession({
				actions: [ActionType.Swap],
			})
			activeSession = created
			return
		}
	})

	const pageTitle = $derived(
		activeSession?.actions[0]
			? (specForAction(sessionActionType(activeSession.actions[0]))?.label ?? 'Session')
			: 'Session',
	)


	// Components
	import LocalGraphScene from '$/components/LocalGraphScene.svelte'
	import SessionView from './Session.svelte'
</script>


<svelte:head>
	<title>{pageTitle} – USDC Tools</title>
</svelte:head>


<main
	id="main"
	data-column
	data-sticky-container
>
	{#if activeSession}
		<SessionView bind:session={activeSession} />
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
	<section data-scroll-item>
		<LocalGraphScene />
	</section>
</main>
