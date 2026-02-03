<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources'

	// Context
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { roomsCollection } from '$/collections/rooms'
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'

	// Functions
	import { roomIdToDisplayName } from '$/lib/room'
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

	// Props
	let { children } = $props()

	// State
	let showGraph = $state(false)

	// (Derived)
	const roomsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: roomsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.select(({ row }) => ({ row })),
		[],
	)
	const sessionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
		[],
	)
	const navigationItems = $derived([
		{
			id: 'bridge',
			title: 'Bridge',
			href: '/bridge',
		},
		{
			id: 'swap',
			title: 'Swap',
			href: '/swap',
		},
		{
			id: 'liquidity',
			title: 'Liquidity',
			href: '/liquidity',
		},
		{
			id: 'sessions',
			title: 'Sessions',
			href: '/session',
			children: (sessionsQuery.data ?? [])
				.map((result) => result.row)
				.sort((a, b) => b.updatedAt - a.updatedAt)
				.map((session) => ({
					id: `session-${session.id}`,
					title: sessionTitle(session),
					href: sessionHref(session),
					tag: session.status,
				})),
		},
		{
			id: 'transfers',
			title: 'Transfers',
			href: '/transfers',
		},
		{
			id: 'wallets',
			title: 'Wallets',
			href: '/wallets',
		},
		{
			id: 'rooms',
			title: 'Rooms',
			href: '/rooms',
			children: (roomsQuery.data ?? [])
				.map((result) => result.row)
				.sort((a, b) => a.createdAt - b.createdAt)
				.map((room) => ({
					id: `room-${room.id}`,
					title: room.name ?? roomIdToDisplayName(room.id),
					href: `/rooms/${room.id}`,
				})),
		},
		{
			id: 'about',
			title: 'About',
			href: '/about',
		},
		{
			id: 'tests',
			title: 'Tests',
			children: [
				{
					id: 'test-collections',
					title: 'Collections',
					href: '/test/collections',
				},
				{
					id: 'test-networks-coins',
					title: 'Networks & coins',
					href: '/test/networks-coins',
				},
				{
					id: 'test-chain-id',
					title: 'Chain ID (Voltaire)',
					href: '/test/chain-id',
				},
			],
		},
	])


	// Components
	import Boundary from '$/components/Boundary.svelte'
	import Navigation from '$/views/Navigation.svelte'
	import ToastContainer from '$/views/ToastContainer.svelte'
	import GraphScene from '$/routes/GraphScene.svelte'


	// Images
	import favicon from '$/lib/assets/favicon.svg'


	// Styles
	import '$/styles/reset.css'
	import '$/styles/colors.css'
	import '$/styles/fonts.css'
	import '$/styles/components.css'
	import '$/styles/accessibility.css'
	// import '$/styles/responsive.css'
	import '$/styles/bits-ui.css'
</script>


<svelte:head>
	<link
		rel="icon"
		href={favicon}
	/>
</svelte:head>


<div
	id="layout"
	class="layout"
	data-scroll-container
	data-sticky-container
>
	<a href="#main" class="skip-link">Skip to main content</a>

	<Navigation
		navigationItems={navigationItems}
	>
	</Navigation>

	<main
		id="main"
		tabindex="-1"
		data-sticky-container
	>
		<section data-scroll-item>
			<Boundary>
				{@render children()}

				{#snippet Failed(error, retry)}
					<div data-column>
						<h2>Error</h2>
						<p>{error instanceof Error ? error.message : String(error)}</p>
						<button type="button" onclick={retry}>Retry</button>
					</div>
				{/snippet}
			</Boundary>
		</section>
	</main>

	<ToastContainer
		position="bottom-right"
	/>

	<button
		type="button"
		class="graph-toggle"
		onclick={() => {
			showGraph = !showGraph
		}}
		title={showGraph ? 'Hide data graph' : 'Show data graph'}
	>
		{showGraph ? '✕' : '◉'}
	</button>

	<GraphScene visible={showGraph} />
</div>


<style>
	.layout {
		/* Constants */
		--navigation-desktop-inlineSize: 20rem;
		--navigation-mobile-blockSize: 4.16rem;

		/* Rules */
		width: 100dvw;
		height: 100dvh;
		padding:
			var(--safeArea-insetTop)
			var(--safeArea-insetRight)
			var(--safeArea-insetBottom)
			var(--safeArea-insetLeft)
		;
		display: grid;
		align-items: start;
		gap: var(--separator-width);

		&[data-scroll-container] {
			--sticky-paddingBlockStart: var(--safeArea-insetTop);
			--sticky-paddingBlockEnd: var(--safeArea-insetBottom);
			--sticky-paddingInlineStart: var(--safeArea-insetLeft);
			--sticky-paddingInlineEnd: var(--safeArea-insetRight);
		}

		@media not (max-width: 1024px) {
			grid-template:
				'Nav Main' 100dvh
				/ var(--navigation-desktop-inlineSize) minmax(auto, 1fr)
			;

			&[data-sticky-container] {
				--sticky-marginInlineStart: var(--separator-width);
				--sticky-paddingInlineStart: var(--navigation-desktop-inlineSize);
			}
		}

		@media (max-width: 1024px) {
			grid-template:
				'Nav' var(--navigation-mobile-blockSize)
				'Main' 1fr
				/ minmax(auto, 1fr)
			;

			&[data-sticky-container] {
				--sticky-marginBlockStart: var(--separator-width);
				--sticky-paddingBlockStart: var(--navigation-mobile-blockSize);
			}
		}

		:global {
			> nav {
				grid-area: Nav;
				box-shadow: 0 0 0 var(--separator-width) var(--border-color);
			}

			> main {
				grid-area: Main;

				&[data-sticky-container] {
					--scrollItem-inlineDetached-maxSize: 54rem;
					--scrollItem-inlineDetached-paddingStart: 2rem;
					--scrollItem-inlineDetached-maxPaddingMatchStart: 5rem;
					--scrollItem-inlineDetached-paddingEnd: 2rem;
					--scrollItem-inlineDetached-maxPaddingMatchEnd: 5rem;
				}
			}
		}
	}

	.graph-toggle {
		position: fixed;
		bottom: 1rem;
		right: 460px;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--color-bg-page, #fff);
		border: 1px solid var(--color-border, #e5e7eb);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		font-size: 0.75rem;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		&:hover {
			transform: scale(1.1);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			background: var(--color-bg-elevated, #f8fafc);
		}
	}
</style>
