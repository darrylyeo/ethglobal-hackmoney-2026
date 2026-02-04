<script lang="ts">
	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'

	// Functions
	import { getTransactionSession, parseSessionHash } from '$/lib/transaction-sessions'

	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'

	let activeSessionId = $state<string | null>(null)
	let hashAction = $state<
		| 'swap'
		| 'bridge'
		| 'transfer'
		| 'liquidity'
		| 'intent'
		| null
	>(null)

	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, activeSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[() => activeSessionId],
	)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const activeAction = $derived(
		session?.actions[0] ?? hashAction ?? 'swap',
	)
	const pageTitle = $derived(
		activeAction === 'bridge' ?
			'USDC Bridge'
		: activeAction === 'transfer' ?
			'Transfer'
		: activeAction === 'swap' ?
			'Swap'
		: activeAction === 'liquidity' ?
			'Liquidity'
		: 'Session',
	)

	$effect(() => {
		if (typeof window === 'undefined') return
		const handleHash = () => {
			const parsed = parseSessionHash(window.location.hash)
			if (parsed.kind === 'session') {
				activeSessionId = parsed.sessionId
				hashAction = getTransactionSession(parsed.sessionId)?.actions[0] ?? null
				return
			}
			if (parsed.kind === 'actions') {
				activeSessionId = null
				hashAction = parsed.actions[0]?.action ?? null
				return
			}
			activeSessionId = null
			hashAction = null
		}
		handleHash()
		window.addEventListener('hashchange', handleHash)
		return () => window.removeEventListener('hashchange', handleHash)
	})

	// Components
	import BridgeView from './BridgeView.svelte'
	import LiquidityView from './LiquidityView.svelte'
	import SwapView from './SwapView.svelte'
	import TransferView from './TransferView.svelte'
</script>


<svelte:head>
	<title>{pageTitle} – USDC Tools</title>
</svelte:head>


{#if activeAction === 'swap'}
	<SwapView />
{:else if activeAction === 'bridge'}
	<BridgeView />
{:else if activeAction === 'transfer'}
	<TransferView />
{:else if activeAction === 'liquidity'}
	<LiquidityView />
{:else}
	<main id="main" data-column data-sticky-container>
		<section data-scroll-item data-column="gap-3">
			<h1>Session</h1>
			<p data-muted>Unsupported session action.</p>
		</section>
	</main>
{/if}
