<script lang="ts">
	// Types/constants
	import type { FarcasterConnectionSiwf } from '$/data/FarcasterConnection.ts'
	import type { SocialPostSession } from '$/data/SocialPostSession.ts'
	import {
		socialPostSessionsCollection,
		updateSocialPostSession,
	} from '$/collections/SocialPostSessions.ts'
	import { useFarcasterConnections } from '$/collections/FarcasterConnections.ts'
	import { APP_NAME } from '$/constants/app.ts'
	import { FarcasterConnectionTransport } from '$/data/FarcasterConnection.ts'
	import { formatSocialPostSessionPlaceholderName } from '$/lib/session/socialPostSessionUrl.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { stringify } from 'devalue'


	// Context
	import { page } from '$app/state'


	// (Derived)
	const sessionId = $derived(page.params.id ?? '')


	// State
	let activeSession = $state<SocialPostSession | null>(null)
	let lastWrittenSnapshot = $state('')


	// Context
	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: socialPostSessionsCollection })
				.where(({ row }) => eq(row.id, sessionId))
				.select(({ row }) => ({ row })),
		[() => sessionId],
	)
	const connectionsQuery = useFarcasterConnections()
	registerLocalLiveQueryStack(() => [
		{ id: 'social-post-session-by-id', label: 'Social post session', query: sessionQuery },
	])


	// (Derived)
	const dbSession = $derived(
		sessionQuery.data?.[0]?.row as SocialPostSession | undefined ?? null,
	)
	const selectedSiwfConnection = $derived(
		((connectionsQuery.data ?? []) as { row: FarcasterConnectionSiwf }[])
			.map((r) => r.row)
			.find(
				(c) =>
					c.transport === FarcasterConnectionTransport.Siwf && c.selected,
			) ?? null,
	)
	const sessionQueryResolved = $derived(sessionQuery.data !== undefined)
	const pageTitle = $derived(
		activeSession
			? (activeSession.name ?? formatSocialPostSessionPlaceholderName(activeSession.actions))
			: 'Social post',
	)


	// Actions
	$effect(() => {
		const next = dbSession
		if (!next) return
		activeSession = next
		lastWrittenSnapshot = stringify({ actions: next.actions, params: next.params })
	})
	$effect(() => {
		const s = activeSession
		if (!s || s.id.startsWith('ephemeral-')) return
		const snap = stringify({ actions: s.actions, params: s.params })
		if (snap === lastWrittenSnapshot) return
		lastWrittenSnapshot = snap
		updateSocialPostSession(s.id, (draft) => {
			draft.actions = s.actions
			draft.params = { ...s.params }
		})
	})


	// Components
	import SocialPostSessionView from '../SocialPostSession.svelte'
</script>

<svelte:head>
	<title>{pageTitle} – {APP_NAME}</title>
</svelte:head>

<main data-column data-sticky-container>
	{#if activeSession}
		<SocialPostSessionView
			bind:session={activeSession}
			{selectedSiwfConnection}
		/>
	{:else if sessionQueryResolved && dbSession === null}
		<section data-scroll-item>
			<p data-text="muted">Social post session not found.</p>
			<a href="/farcaster/session">New post</a>
		</section>
	{:else}
		<section data-scroll-item data-column="gap-3">
			<header data-row="wrap gap-4">
				<h1>Social post</h1>
			</header>
			<p data-text="muted">Loading…</p>
		</section>
	{/if}
</main>
