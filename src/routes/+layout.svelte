<script lang="ts">
	// Polyfills (run before other imports that may use crypto.randomUUID)
	import '$/lib/randomUuid.ts'

	// Profiles (boot/migrate before collections read from localStorage; browser-only)
	import { browser } from '$app/environment'
	import { ensureProfilesMeta } from '$/lib/profile.ts'
	if (browser) ensureProfilesMeta()


	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'
	import { NetworkEnvironment } from '$/constants/network-environment.ts'
	import { networkEnvironmentState } from '$/state/network-environment.svelte.ts'


	// Context
	import { eq, not, useLiveQuery } from '@tanstack/svelte-db'
	import { myPeerIdsCollection } from '$/collections/MyPeerIds.ts'
	import { partykitRoomPeersCollection } from '$/collections/PartykitRoomPeers.ts'
	import { partykitRoomsCollection } from '$/collections/PartykitRooms.ts'
	import { agentChatTreesCollection } from '$/collections/AgentChatTrees.ts'
	import { bridgeTransactionsCollection } from '$/collections/BridgeTransactions.ts'
	import { sessionsCollection } from '$/collections/Sessions.ts'
	import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
	import {
	dashboardsCollection,
	ensureDefaultRow,
} from '$/collections/Dashboards.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { watchedEntitiesCollection } from '$/collections/WatchedEntities.ts'
	import { walletsCollection } from '$/collections/Wallets.ts'
	import {
		createLiveQueryContext,
		registerGlobalLiveQueryStack,
		setGlobalLiveQueryContext,
		setLocalLiveQueryContext,
	} from '$/svelte/live-query-context.svelte.ts'


	// Functions
	import { getNavigationItems } from '$/routes/navigationItems.svelte.ts'


	// Props
	let { children: page } = $props()


	// State
	const globalLiveQueryCtx = createLiveQueryContext()
	const localLiveQueryCtx = createLiveQueryContext()
	setGlobalLiveQueryContext(globalLiveQueryCtx)
	setLocalLiveQueryContext(localLiveQueryCtx)


	// (Derived)
	const roomsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: partykitRoomsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.select(({ row }) => ({ row })),
		[],
	)
	const sessionsQuery = useLiveQuery(
		(q) =>
			q.from({ row: sessionsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const agentChatTreesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: agentChatTreesCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const watchedEntitiesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: watchedEntitiesCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const recentTransactionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: bridgeTransactionsCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const walletsQuery = useLiveQuery(
		(q) =>
			q.from({ row: walletsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const walletConnectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q.from({ row: siweVerificationsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const roomPeersQuery = useLiveQuery(
		(q) => q.from({ row: partykitRoomPeersCollection }).select(({ row }) => ({ row })),
		[],
	)
	const myPeerIdsQuery = useLiveQuery(
		(q) =>
			q.from({ row: myPeerIdsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const dashboardsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardsCollection })
				.where(({ row }) => not(eq(row.$id.id, '__default__')))
				.select(({ row }) => ({
					id: row.$id.id,
					name: 'name' in row ? row.name : undefined,
					icon: 'icon' in row ? row.icon : undefined,
				})),
		[],
	)
	const defaultDashboardRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardsCollection })
				.where(({ row }) => eq(row.$id.id, '__default__'))
				.select(({ row }) =>
					'defaultDashboardId' in row
						? { defaultDashboardId: row.defaultDashboardId }
						: { defaultDashboardId: undefined as string | undefined },
				),
		[],
	)
	$effect(() => {
		ensureDefaultRow()
	})
	const defaultDashboardId = $derived(
		defaultDashboardRowQuery.data?.[0]?.defaultDashboardId ?? 'default',
	)
	registerGlobalLiveQueryStack(() => [
		{ id: 'layout-wallet-connections', label: 'Wallet Connections', query: walletConnectionsQuery },
		{ id: 'layout-sessions', label: 'Sessions', query: sessionsQuery },
		{ id: 'layout-wallets', label: 'Wallets', query: walletsQuery },
		{ id: 'layout-transactions', label: 'Transactions', query: recentTransactionsQuery },
		{ id: 'layout-watched', label: 'Watched Entities', query: watchedEntitiesQuery },
	])
	const isTestnet = $derived(
		networkEnvironmentState.current === NetworkEnvironment.Testnet,
	)
	const navigationItems = $derived(
		getNavigationItems({
			sessionsData: sessionsQuery.data,
			roomsData: roomsQuery.data,
			agentChatTreesData: agentChatTreesQuery.data,
			watchedEntitiesData: watchedEntitiesQuery.data,
			recentTransactionsData: recentTransactionsQuery.data,
			walletsData: walletsQuery.data,
			walletConnectionsData: walletConnectionsQuery.data,
			verificationsData: verificationsQuery.data,
			roomPeersData: roomPeersQuery.data,
			myPeerIdsData: myPeerIdsQuery.data,
			dashboardsData: dashboardsQuery.data,
			defaultDashboardId,
			coinIcons: { eth: iconEth, usdc: iconUsdc },
			isTestnet,
		}),
	)


	// Components
	import iconEth from '$/assets/coins/eth.svg?url'
	import iconUsdc from '$/assets/coins/usdc.svg?url'
	import { Tooltip } from 'bits-ui'
	import Boundary from '$/components/Boundary.svelte'
	import IntentDragPreview from '$/components/IntentDragPreview.svelte'
	import GraphScene from '$/routes/GraphScene.svelte'
	import Navigation from '$/views/Navigation.svelte'
	import ToastContainer from '$/views/ToastContainer.svelte'


	// Images
	import favicon from '$/assets/favicon.svg'


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
	<div
		id="layout"
		data-scroll-container
		data-sticky-container
	>
		<a
			href="#main"
			class="skip-link"
		>Skip to main content</a>

		<Navigation
			{navigationItems}
		/>

		<div
			class="layout-main"
			data-sticky-container
			data-column
		>
			<!-- <aside
				id="global-graph"
				data-sticky="backdrop-none"
			>
				<GraphScene
					queryStack={localLiveQueryCtx.stack}
					globalQueryStack={globalLiveQueryCtx.stack}
				/>
			</aside> -->

			<Boundary>
				{#snippet children()}
					{@render page()}
				{/snippet}
				{#snippet failed(error)}
					<main data-column>
						<h2>Error</h2>
						<p>{error instanceof Error ? error.message : String(error)}</p>
					</main>
				{/snippet}
			</Boundary>
		</div>
	</div>

	<IntentDragPreview />

	<ToastContainer position="bottom-right" />
</Tooltip.Provider>


<style>
	#layout {
		/* Constants */
		--navigation-desktop-inlineSize: 21rem;
		--navigation-mobile-blockSize: 4rem;

		/* Rules */
		width: 100dvw;
		height: 100dvh;
		padding: var(--safeArea-insetTop) var(--safeArea-insetRight) var(--safeArea-insetBottom) var(--safeArea-insetLeft);
		display: grid;
		align-items: start;
		gap: var(--separator-width);

		&[data-scroll-container] {
			--sticky-paddingBlockStart: var(--safeArea-insetTop);
			--sticky-paddingBlockEnd: var(--safeArea-insetBottom);
			--sticky-paddingInlineStart: var(--safeArea-insetLeft);
			--sticky-paddingInlineEnd: var(--safeArea-insetRight);
		}

		@media (width >= 60rem) {
			grid-template:
				'Nav Main' 100dvh
				/ auto minmax(auto, 1fr)
			;

			&[data-sticky-container] {
				--sticky-marginInlineStart: var(--separator-width);
				--sticky-paddingInlineStart: var(--navigation-desktop-inlineSize);
			}

			> :global(nav) {
				max-inline-size: var(--navigation-desktop-inlineSize);
				resize: horizontal;
			}
		}

		@media (width < 60rem) {
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

		> :global(nav) {
			grid-area: Nav;
			box-shadow: 0 0 0 var(--separator-width) var(--border-color);
		}

		> .layout-main {
			grid-area: Main;

			--sticky-paddingInlineStart: clamp(1rem, 6cqi, 2rem);
			--sticky-paddingInlineEnd: clamp(1rem, 6cqi, 2rem);

			padding: 1.5rem;

			/* > :global(main) {
				--graph-scroll-blur-size: 1rem;

				position: relative;
				min-height: 100dvh;

				&::before,
				&::after {
					content: '';
					position: absolute;
					z-index: -1;
					inset: calc(-1 * var(--graph-scroll-blur-size));
					pointer-events: none;
					mask-image:
						linear-gradient(to bottom, transparent 0, black var(--graph-scroll-blur-size)),
						linear-gradient(to top, transparent 0, black var(--graph-scroll-blur-size)),
						linear-gradient(to right, transparent 0, black var(--graph-scroll-blur-size)),
						linear-gradient(to left, transparent 0, black var(--graph-scroll-blur-size))
					;
					mask-composite: intersect;
					mask-size: 100% 100%;
					mask-repeat: no-repeat;
				}

				&::before {
					backdrop-filter: blur(calc(8px * (1 - var(--graph-scroll-progress, 0))));
				}

				&::after {
					backdrop-filter: blur(calc(8px * var(--graph-scroll-progress, 0)));
					-webkit-backdrop-filter: blur(calc(8px * var(--graph-scroll-progress, 0)));
				}
			} */
		}
	}

	#global-graph {
		z-index: -1;
	}
</style>
