<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'

	// Functions
	import { buildSessionHash } from '$/lib/transaction-sessions'

	const flowLabel = (flow: string) => (
		flow.length > 0 ? `${flow[0].toUpperCase()}${flow.slice(1)}` : 'Session'
	)
	const flowRoute = (flow: string) => (
		flow === 'bridge' ?
			'/bridge'
		: flow === 'liquidity' ?
			'/liquidity'
		: flow === 'transfer' ?
			'/transfer'
		: flow === 'intent' ?
			'/test/intents'
		: '/swap'
	)
	const sessionTitle = (session: {
		id: string
		flows: string[]
	}) => (
		`${flowLabel(session.flows[0] ?? '')} ${session.id.slice(0, 6)}`
	)
	const sessionHref = (session: {
		id: string
		flows: string[]
	}) => (
		`${flowRoute(session.flows[0] ?? '')}${buildSessionHash(session.id)}`
	)

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
	const sessions = $derived(
		(sessionsQuery.data ?? [])
			.map((result) => result.row)
			.sort((a, b) => b.updatedAt - a.updatedAt),
	)
</script>


<svelte:head>
	<title>Sessions – USDC Tools</title>
</svelte:head>


<main
	id="main"
	data-column
	data-sticky-container
>
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
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
