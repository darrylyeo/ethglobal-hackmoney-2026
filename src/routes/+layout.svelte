<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources'

	// Context
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { roomsCollection } from '$/collections/rooms'
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'
	import {
		useLiveQueryContext,
		useLocalLiveQueryContext,
	} from '$/svelte/live-query-context.svelte'

	// Functions
	import { roomIdToDisplayName } from '$/lib/room'
	import { buildSessionHash } from '$/lib/transaction-sessions'

	const actionLabel = (action: string) => (
		action.length > 0 ? `${action[0].toUpperCase()}${action.slice(1)}` : 'Session'
	)
	const sessionTitle = (session: {
		id: string
		actions: string[]
	}) => (
		`${actionLabel(session.actions[0] ?? '')} ${session.id.slice(0, 6)}`
	)
	const sessionHref = (session: {
		id: string
		actions: string[]
	}) => (
		`/session${buildSessionHash(session.id)}`
	)

	// Props
	let { children } = $props()

	// State
	let showGraph = $state(false)
	const globalLiveQueryCtx = useLiveQueryContext()
	const localLiveQueryCtx = useLocalLiveQueryContext()

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
	const layoutLiveQueryEntries = [
		{ id: 'layout-rooms', label: 'Rooms', query: roomsQuery },
		{ id: 'layout-sessions', label: 'Sessions', query: sessionsQuery },
	]
	const navigationItems = $derived([
		{
			id: 'about',
			title: 'About',
			href: '/about',
		},
		{
			id: 'dashboard',
			title: 'Dashboard',
			href: '/dashboard',
		},
		{
			id: 'wallets',
			title: 'Wallets',
			href: '/wallets',
		},
		{
			id: 'sessions',
			title: 'Sessions',
			href: '/sessions',
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
			id: 'bridge',
			title: 'Bridge',
			href: '/session#bridge',
		},
		{
			id: 'swap',
			title: 'Swap',
			href: '/session#swap',
		},
		{
			id: 'transfer',
			title: 'Transfer',
			href: '/session#transfer',
		},
		{
			id: 'liquidity',
			title: 'Liquidity',
			href: '/session#liquidity',
		},
		{
			id: 'transfers',
			title: 'Transfers',
			href: '/transfers',
		},
		{
			id: 'channels-yellow',
			title: 'Yellow Channels',
			href: '/channels/yellow',
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
	import { Tooltip } from 'bits-ui'
	import Boundary from '$/components/Boundary.svelte'
	import IntentDragPreview from '$/components/IntentDragPreview.svelte'
	import LiveQueryScope from '$/components/LiveQueryScope.svelte'
	import GraphScene from '$/routes/GraphScene.svelte'
	import Navigation from '$/views/Navigation.svelte'
	import ToastContainer from '$/views/ToastContainer.svelte'


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


<Tooltip.Provider>
	<LiveQueryScope entries={layoutLiveQueryEntries} scope="global">
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

		<IntentDragPreview />

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

		<GraphScene
			visible={showGraph}
			queryStack={localLiveQueryCtx.stack}
			globalQueryStack={globalLiveQueryCtx.stack}
		/>
		</div>
	</LiveQueryScope>
</Tooltip.Provider>


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
				box-shadow: 0 0 0 var(--separator-width) var(--color-border);
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
		background: var(--color-bg-page);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-md);
		cursor: pointer;
		font-size: 0.75rem;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;

		&:hover {
			transform: scale(1.1);
			box-shadow: var(--shadow-lg);
			background: var(--color-bg-subtle);
		}
	}
</style>
