<script lang="ts">
	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'

	// Functions
	import { buildSessionHash } from '$/lib/transaction-sessions'

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

	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'

	const sessionId = $derived(page.params.id ?? '')
	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, sessionId))
				.select(({ row }) => ({ row })),
		[() => sessionId],
	)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)

	$effect(() => {
		if (!session) return
		goto(`${flowRoute(session.flows[0] ?? '')}${buildSessionHash(session.id)}`, {
			replaceState: true,
		})
	})
</script>


<svelte:head>
	<title>Session – USDC Tools</title>
</svelte:head>


<main
	id="main"
	data-column
	data-sticky-container
>
	<section data-scroll-item>
		{#if session}
			<p data-muted>Redirecting to session…</p>
		{:else}
			<p data-muted>Session not found.</p>
			<a href="/session">Back to sessions</a>
		{/if}
	</section>
</main>
