<script lang="ts">
	// Types/constants
	import { socialPostActionTypeDefinitionByType } from '$/constants/social-post-actions.ts'
	import type { SocialPostAction } from '$/constants/social-post-actions.ts'
	import { APP_NAME } from '$/constants/app.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { SocialPostSessionStatus } from '$/data/SocialPostSession.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { formatSocialPostSessionPlaceholderName } from '$/lib/session/socialPostSessionUrl.ts'
	import { formatRelativeTime } from '$/lib/formatRelativeTime.ts'
	import {
		deleteSocialPostSession,
		socialPostSessionsCollection,
	} from '$/collections/SocialPostSessions.ts'
	import WatchButton from '$/components/WatchButton.svelte'

	const sessionTitle = (session: { name?: string; actions: SocialPostAction[] }) =>
		session.name ?? formatSocialPostSessionPlaceholderName(session.actions)
	const sessionIcon = (session: { actions: SocialPostAction[] }) =>
		(socialPostActionTypeDefinitionByType as Record<string, { icon: string }>)[
			session.actions[0]?.type
		]?.icon ?? '✍️'

	const sessionsQuery = useLiveQuery(
		(q) =>
			q.from({ row: socialPostSessionsCollection }).select(({ row }) => ({ row })),
		[],
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'social-post-sessions-list', label: 'Social post sessions', query: sessionsQuery },
	])

	const sessions = $derived(
		(sessionsQuery.data ?? [])
			.map(({ row: session }) => session)
			.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
	)
	const draftCount = $derived(
		sessions.filter((s) => s.status === SocialPostSessionStatus.Draft).length
	)
	let now = $state(
		Date.now()
	)
	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 60_000)
		return () => clearInterval(id)
	})
</script>


<svelte:head>
	<title>Social posts – {APP_NAME}</title>
</svelte:head>


<main
	data-column
	data-sticky-container
>
	<section
		data-scroll-item
		data-column="gap-3"
	>
		<header data-row="wrap gap-4">
			<div
				data-row="start"
				data-row-item="flexible"
			>
				<h1>
					Social posts
				</h1>
			</div>

			<div data-row>
				<a
					href="/farcaster/session?template=CreatePost"
					data-button
				>
					New post
				</a>
				{#if draftCount > 0}
					<button
						type="button"
						onclick={() => {
							for (const s of sessions) {
								if (s.status === SocialPostSessionStatus.Draft)
									deleteSocialPostSession(s.$id.id)
							}
						}}
					>
						Delete all drafts ({draftCount})
					</button>
				{/if}
			</div>
		</header>

		{#if sessions.length === 0}
			<p data-text="muted">
				No social post sessions yet.
			</p>
			<p data-text="muted">
				<a href="/farcaster/session?template=CreatePost">
					Create a post
				</a>
				to get started.
			</p>
		{:else}
			<ul
				data-columns="width-5 gap-3"
				data-list="unstyled"
			>
				{#each sessions as session (session.$id.id)}
					<li
						data-columns-item
						data-card="radius-4"
					>
						<div data-column>
							<div data-row="align-center wrap">
								<a
									href="/farcaster/session/{session.$id.id}"
									data-row-item="flexible"
								>
									<span data-row="align-center">
										<span aria-hidden="true">{sessionIcon(session)}</span>
										{sessionTitle(session)}
									</span>
								</a>

								<span data-row="align-center">
									<span data-tag>{session.status}</span>

									<WatchButton
										entityType={EntityType.SocialPostSession}
										entity={session}
									/>

									<button
										type="button"
										aria-label="Delete social post session"
										onclick={() => deleteSocialPostSession(session.$id.id)}
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
