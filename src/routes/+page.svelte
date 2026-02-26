<script lang="ts">
	// Types/constants
	import type { PanelTreeNode } from '$/data/PanelTree.ts'
	import mascot from '$/assets/blockhead-mascot.jpg'
	import {
		dashboardsCollection,
		ensureDefaultRow,
		getDashboardState,
	} from '$/collections/Dashboards.ts'
	import { APP_NAME } from '$/constants/app.ts'
	import { CoinId } from '$/constants/coins.ts'
	import { layerColors } from '$/views/architecture-graph.ts'
	import { and, eq, not, useLiveQuery } from '@tanstack/svelte-db'

	const valuePhrases = [
		'Thoughtfully crafted affordances',
		'Good defaults',
		'Visualization & simulation',
		'Confidence without hiding complexity',
	]
	const features = [
		{
			title: 'Dashboards',
			summary: 'Resizable split-view panels; each panel navigates to any page in the app.',
			href: '/dashboards',
		},
		{
			title: 'Accounts',
			summary: 'Watch "0x" or ENS addresses, or connect multiple wallets (EIP-6963). Per account: coin balances, transactions, DeFi positions.',
			href: '/accounts',
		},
		{
			title: 'Explore',
			summary: 'Browse networks, accounts, blocks, transactions and onchain entities; watch any entity to pin to nav and graph.',
			href: `/coin/${CoinId.USDC}`,
		},
		{
			title: 'Sessions',
			summary: 'Draft, preview, simulate, sign and broadcast action sequences; local state, real-time onchain sync.',
			href: '/sessions',
		},
		{
			title: 'Simulations',
			summary: 'Simulate transactions in session actions with a local chain fork (Tevm).',
			href: '/session',
		},
		{
			title: 'Drag-and-drop intents',
			summary: 'Drag entities onto others to start sessions (e.g. transfer, swap, bridge).',
			href: '/session',
		},
		{
			title: 'Graph visualizations',
			summary: 'Explore entity relationships; nodes and edges update as you navigate.',
			href: '/dashboard',
		},
		{
			title: 'Rooms',
			summary: 'Real-time multiplayer rooms (PartyKit): share addresses, Sign In with Ethereum, state channels, transfer requests.',
			href: '/rooms',
		},
		{
			title: 'State channels',
			summary: 'ERC-7824 (Yellow): open, fund, off-chain transfers, settle; state synced locally.',
			href: '/positions/channels',
		},
		{
			title: 'Liquidity positions',
			summary: 'Uniswap V4: add/remove liquidity, increase size, collect fees across watched accounts.',
			href: '/positions/liquidity',
		},
		{
			title: 'Agent chats',
			summary: 'Chat with LLMs (bring your own API keys); @-mention entities for context, fork conversations.',
			href: '/agents',
		},
		{
			title: 'Local-first profiles',
			summary: 'Wallet state, sessions, watched entities and history in browser; create, switch, export or delete profiles.',
			href: '/accounts',
		},
		{
			title: 'Network environments',
			summary: 'Mainnet/testnet toggle; profile data segregated, UI adapts by environment.',
		},
		// {
		// 	title: 'About',
		// 	summary: 'Architecture diagram: data flows, services, and external dependencies.',
		// 	href: '/about',
		// },
	]
	const heroCtas = [
		{ href: '/session', label: 'Start session', primary: true },
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: `/coin/${CoinId.USDC}`, label: 'USDC' },
		{ href: '/rooms', label: 'Rooms' },
	]
	const legendItems = [
		{ id: 'client', label: 'Client UI', color: layerColors.client },
		{ id: 'state', label: 'State + Collections', color: layerColors.state },
		{ id: 'services', label: 'Services + Protocols', color: layerColors.services },
		{ id: 'external', label: 'External APIs', color: layerColors.external },
		{ id: 'networks', label: 'Networks', color: layerColors.networks },
		{ id: 'tooling', label: 'Tooling', color: layerColors.tooling },
	]


	// Context
	import { resolve } from '$app/paths'
	const defaultRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardsCollection })
				.where(({ row }) => eq(row.$id.id, '__default__'))
				.select(({ row }) => ({ row })),
		[],
	)


	// (Derived)
	const defaultDashboardId = $derived(
		(() => {
			const dashboard = defaultRowQuery.data?.[0]?.row
			return dashboard && 'defaultDashboardId' in dashboard ? dashboard.defaultDashboardId : undefined
		})() ?? 'default',
	)


	// Context
	const dashboardRowVersionQuery = useLiveQuery(
		(q) =>
			q
				.from({ dashboard: dashboardsCollection })
				.where(({ dashboard }) =>
					and(
						not(eq(dashboard.$id.id, '__default__')),
						eq(dashboard.$id.id, defaultDashboardId),
					),
				)
				.select(({ dashboard }) => ({ dashboard })),
		[() => defaultDashboardId],
	)

	// (Derived) — plain copy so SSR/devalue never sees TanStack refs
	const previewRoot = $derived.by(() => {
		dashboardRowVersionQuery.data
		const row = getDashboardState(defaultDashboardId)
		const root = row && 'root' in row ? row.root : undefined
		return root != null ? (JSON.parse(JSON.stringify(root)) as PanelTreeNode) : undefined
	})


	// Functions
	const firstPanelId = (node: PanelTreeNode): string =>
		node.type === 'panel' ? node.id : firstPanelId(node.first)
	const noop = () => {}


	// Actions
	$effect(() => {
		ensureDefaultRow()
	})


	// Components
	import ArchitectureGraph from '$/views/ArchitectureGraph.svelte'
	import PanelTree from '$/routes/dashboard/PanelTree.svelte'
</script>


<main>
	<article class="landing">
	<header class="landing-hero" data-column="center gap-4">
		<img src={mascot} alt="" class="landing-mascot" width="240" height="240" />
		<h1>{APP_NAME}</h1>
		<p class="landing-tagline">
			Local-first object-oriented GUI client for blockchain exploration, onchain
			asset management and peer-to-peer DeFi interactions
		</p>
		<!-- <p class="landing-value" aria-hidden="true">
			{#each valuePhrases as phrase, i (i)}
				{#if i > 0}<span class="landing-value-sep" aria-hidden="true"> · </span>{/if}
				{phrase}
			{/each}
		</p> -->
		<!-- <nav aria-label="Primary actions" data-column="center gap-3">
			<div data-grid="columns-autofit gap-2 column-min-6">
				{#each heroCtas as { href, label, primary }}
					{#if primary}
						<a
							href={resolve(href)}
							data-card="border-accent"
							data-column="gap-1 center"
						>
							<span>{label}</span>
						</a>
					{:else}
						<a data-link href={resolve(href)}>{label}</a>
					{/if}
				{/each}
			</div>
		</nav> -->

		{#if previewRoot}
			<a
				href={resolve('/dashboard')}
				class="landing-dashboard-preview"
				aria-label="Open dashboard"
				data-scroll-container="inline"
			>
				<div class="landing-dashboard-preview-zoom">
					<div class="landing-dashboard-preview-inner">
						<PanelTree
						root={previewRoot}
						focusedPanelId={firstPanelId(previewRoot)}
						onFocus={noop}
						onSplit={noop}
						onRemove={noop}
						onSwap={noop}
						onUpdateRoute={noop}
						onAppendHash={noop}
						onSetPanelHash={noop}
						onNavigate={noop}
						onOpenInNewPanel={noop}
						onSetSplitRatio={noop}
						onSetSplitRatioOverride={noop}
						onClearSplitRatioOverride={noop}
						onToggleSplitDirection={noop}
					/>
					</div>
				</div>
			</a>
		{/if}
	</header>

	<section
		class="landing-features"
		data-scroll-item
		data-column="gap-4"
		aria-label="Features"
	>
		<h2 class="landing-features-title">Features</h2>
		<ul class="landing-features-list" data-grid="columns-autofit gap-3 column-min-18">
			{#each features as { title, summary, href }}
				<li>
					{#if href}
						<a
							href={resolve(href)}
							data-card="padding-3"
							data-column
						>
							<strong>{title}</strong>
							<p class="landing-features-summary">{summary}</p>
						</a>
					{:else}
						<div data-card="padding-3" data-column>
							<strong>{title}</strong>
							<p class="landing-features-summary">{summary}</p>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section
		id="about"
		class="landing-about"
		data-scroll-item
		data-column="gap-4"
		aria-label="About"
	>
		<header class="landing-about__header" data-column>
			<h2>About</h2>
			<p>
				{APP_NAME} is a SvelteKit app for bridging, swapping, and tracking USDC
				across supported chains. It combines TanStack DB collections, Voltaire
				(RPC + ABI helpers), LI.FI routing, Circle CCTP, realtime PartyKit rooms,
				Yellow state channels, and Stork price feeds. The diagram below maps
				runtime systems, data flows, and external dependencies.
			</p>
		</header>

		<section class="landing-about__diagram" aria-label="Architecture diagram">
			<ArchitectureGraph height="72vh" />
		</section>

		<section
			class="landing-about__legend"
			data-card
			data-column
			aria-label="Diagram legend"
		>
			<h3>Legend</h3>
			<div data-grid="columns-autofit column-min-12 gap-3" class="landing-about__legend-grid">
				{#each legendItems as item (item.id)}
					<div class="landing-about__legend-item" data-row="start">
						<span
							class="landing-about__legend-swatch shape-rect"
							data-row
							style:background={item.color}
						></span>
						<span>{item.label}</span>
					</div>
				{/each}
			</div>

			<div data-grid="columns-autofit column-min-12 gap-3" class="landing-about__legend-grid">
				<div class="landing-about__legend-item" data-row="start">
					<span class="landing-about__legend-swatch shape-rect" data-row></span>
					<span>Flow / service node</span>
				</div>
				<div class="landing-about__legend-item" data-row="start">
					<span class="landing-about__legend-swatch shape-circle" data-row></span>
					<span>State or data node</span>
				</div>
				<div class="landing-about__legend-item" data-row="start">
					<span class="landing-about__legend-swatch shape-diamond" data-row></span>
					<span>Wallet / channel node</span>
				</div>
				<div class="landing-about__legend-item" data-row="start">
					<span class="landing-about__legend-swatch shape-image" data-row></span>
					<span>Chain icon node</span>
				</div>
				<div class="landing-about__legend-item" data-row="start">
					<span class="landing-about__legend-swatch shape-line" data-row></span>
					<span>Directional flow</span>
				</div>
				<div class="landing-about__legend-item" data-row="start">
					<span class="landing-about__legend-swatch shape-dashed" data-row></span>
					<span>Optional / enrichment path</span>
				</div>
			</div>
			<dl class="landing-about__legend-details" data-row="wrap gap-x-4 gap-y-1">
				<dt>Edges</dt>
				<dd>
					Arrows show action direction. Solid = sync, dashed = async or optional.
					Thicker blue edges = critical execution paths.
				</dd>
				<dt>Networks</dt>
				<dd>Mainnets use solid outlines; testnets use dashed outlines.</dd>
				<dt>Interactions</dt>
				<dd>
					Drag to pan; scroll or <kbd>+</kbd>/<kbd>−</kbd> to zoom; <kbd>0</kbd>
					to fit; <kbd>Escape</kbd> to clear selection. Hover for details.
				</dd>
				<dt id="explain-results-fallback">Explain fallback</dt>
				<dd>
					Optional LLM explanations use Chrome Prompt API when available; you can
					set up a hosted fallback for other environments.
				</dd>
			</dl>
		</section>
	</section>
	</article>
</main>


<style>
	.landing {
		padding-block: clamp(2rem, 10vh, 4rem);
		padding-inline: 1rem;

		& .landing-hero {
			view-timeline: --hero block;
			animation: hero-reveal linear;
			animation-timeline: view(--hero);
			animation-range: entry 0% entry 50%;
			animation-fill-mode: both;
			align-content: center;
			text-align: center;
			min-block-size: 60vh;
			padding-block: 2rem;
			background: radial-gradient(
				ellipse 80% 50% at 50% 0%,
				var(--color-accent-bg) 0%,
				transparent 70%
			);
			border-radius: 0 0 1.5rem 1.5rem;

			& .landing-mascot {
				inline-size: clamp(8rem, 20vw, 15rem);
				block-size: auto;
				border-radius: 50%;
				object-fit: cover;
			}

			& h1 {
				font-size: clamp(2rem, 5vw, 2.75rem);
				font-weight: 700;
				letter-spacing: -0.02em;
				line-height: 1.15;
			}

			& nav [data-grid] {
				padding-block-start: 0.25rem;
			}

			& nav a[data-card] {
				text-decoration: none;
				color: var(--color-accent);
				font-weight: 600;
				transition: background-color 0.2s ease, box-shadow 0.2s ease;
				box-shadow: var(--shadow-sm);

				&:hover {
					background-color: var(--color-accent-bg);
					box-shadow: var(--shadow-md);
				}
			}

			& nav a[data-link] {
				padding: 0.35em 0.5em;
				border-radius: 0.35em;

				&:hover {
					background-color: var(--color-bg-muted);
				}
			}
		}

		@keyframes hero-reveal {
			from {
				opacity: 0;
				transform: translateY(1.5rem);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}

		& .landing-tagline {
			max-inline-size: 42ch;
			color: var(--color-text-muted);
			font-size: 1.1rem;
			line-height: 1.5;
		}

		& .landing-value {
			max-inline-size: 56ch;
			font-size: 0.9rem;
			line-height: 1.5;
			color: var(--color-text-muted);
		}

		& .landing-value-sep {
			opacity: 0.7;
		}

		@keyframes routes-reveal {
			from {
				opacity: 0;
				transform: translateY(1rem);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}

		& .landing-features {
			view-timeline: --features block;
			animation: routes-reveal linear;
			animation-timeline: view(--features);
			animation-range: entry 5% entry 40%;
			animation-fill-mode: both;
			padding-block: 3rem 1rem;
			border-block-start: 1px solid var(--color-border);
		}

		& .landing-features-title {
			font-size: 0.8125rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			color: var(--color-text-muted);
			margin-block-end: 0.5rem;
		}

		& .landing-features-list {
			list-style: none;
			margin: 0;
			padding: 0;

			& li {
				display: flex;
			}
		}

		& .landing-features-list li > a,
		& .landing-features-list li > div {
			display: flex;
			flex-direction: column;
			flex: 1;
			min-height: 0;
			text-decoration: none;
			color: inherit;
			transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
			border: 1px solid transparent;
		}

		& .landing-features-list li > a:hover,
		& .landing-features-list li > div:hover {
			background-color: var(--color-bg-muted);
			box-shadow: var(--shadow-sm);
			border-color: var(--color-border);
		}

		& .landing-features-summary {
			margin: 0;
			font-size: 0.9rem;
			color: var(--color-text-muted);
			line-height: 1.45;
		}

		& .landing-about {
			width: 100%;
			padding-block: 3rem 1rem;
			border-block-start: 1px solid var(--color-border);

			& .landing-about__header {
				max-width: 46rem;
			}

			& .landing-about__legend {
				gap: 1.5rem;

				& .landing-about__legend-grid {
					column-gap: 1.5rem;
				}

				& .landing-about__legend-item {
					font-size: 0.9rem;
				}

				& .landing-about__legend-swatch {
					width: 1.15rem;
					height: 1.15rem;
					border-radius: 0.25rem;
					border: 1px solid var(--color-border);
					background: var(--color-bg-subtle);

					&.shape-circle {
						border-radius: 50%;
					}

					&.shape-diamond {
						transform: rotate(45deg);
					}

					&.shape-image {
						border-style: dashed;
					}

					&.shape-line {
						width: 1.6rem;
						height: 0.2rem;
						border: none;
						background: var(--color-text);
					}

					&.shape-dashed {
						width: 1.6rem;
						height: 0.2rem;
						border: none;
						background: repeating-linear-gradient(
							90deg,
							var(--color-text) 0,
							var(--color-text) 6px,
							transparent 6px,
							transparent 10px
						);
					}
				}
			}

			& .landing-about__legend-details {
				font-size: 0.875rem;

				& dt {
					font-weight: 600;
				}

				& dd {
					margin: 0;
				}
			}
		}

		& .landing-about__diagram {
			width: 100%;
			min-height: 460px;
		}
	}
</style>
