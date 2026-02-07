<script lang="ts">


	// Types/constants
	import type { PanelTreeNode } from '$/data/PanelTree.ts'
	import { APP_NAME } from '$/constants/app.ts'
	import { architectureGraph } from '$/views/architecture-graph.ts'


	// Context
	import { and, eq, not, useLiveQuery } from '@tanstack/svelte-db'
	import { resolve } from '$app/paths'
	import {
		dashboardPanelsCollection,
		ensureDefaultRow,
	} from '$/collections/dashboard-panels.ts'
	import PanelTree from '$/routes/dashboard/PanelTree.svelte'
	import ArchitectureGraph from '$/views/ArchitectureGraph.svelte'


	// (Derived)
	$effect(() => {
		ensureDefaultRow()
	})
	const defaultRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardPanelsCollection })
				.where(({ row }) => eq(row.$id.id, '__default__'))
				.select(({ row }) =>
					'defaultDashboardId' in row
						? { defaultDashboardId: row.defaultDashboardId }
						: { defaultDashboardId: undefined as string | undefined },
				),
		[],
	)
	const defaultDashboardId = $derived(
		defaultRowQuery.data?.[0]?.defaultDashboardId ?? 'default',
	)
	const dashboardRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardPanelsCollection })
				.where(({ row }) =>
					and(
						not(eq(row.$id.id, '__default__')),
						eq(row.$id.id, defaultDashboardId),
					),
				)
				.select(({ row }) => ({ row })),
		[() => defaultDashboardId],
	)
	const previewRow = $derived(dashboardRowQuery.data?.[0]?.row)
	const previewRoot = $derived(
		previewRow && 'root' in previewRow ? previewRow.root : undefined,
	)
	const firstPanelId = (node: PanelTreeNode): string =>
		node.type === 'panel' ? node.id : firstPanelId(node.first)
	const previewFocusedPanelId = $derived(
		previewRoot ? firstPanelId(previewRoot) : '',
	)

	const noop = () => {}
	const primaryCta = { href: '/session', label: 'Start session' }
	const secondaryCtas = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/coin/USDC', label: 'USDC' },
		{ href: '/rooms', label: 'Rooms' },
	]
	const routes = [
		{ href: '/dashboard', title: 'Dashboard' },
		{ href: '/accounts', title: 'Accounts' },
		{ href: '/sessions', title: 'Sessions' },
		{ href: '/actions', title: 'Actions' },
		{ href: '/session', title: 'Session' },
		{ href: '/coin/USDC', title: 'USDC' },
		{ href: '/rooms', title: 'Rooms' },
		{ href: '/test/collections', title: 'Tests' },
	]
	const legendItems = [
		{ id: 'client', label: 'Client UI', color: architectureGraph.layerColors.client },
		{ id: 'state', label: 'State + Collections', color: architectureGraph.layerColors.state },
		{ id: 'services', label: 'Services + Protocols', color: architectureGraph.layerColors.services },
		{ id: 'external', label: 'External APIs', color: architectureGraph.layerColors.external },
		{ id: 'networks', label: 'Networks', color: architectureGraph.layerColors.networks },
		{ id: 'tooling', label: 'Tooling', color: architectureGraph.layerColors.tooling },
	]
</script>


<article class="landing">
	<header class="landing-hero" data-column="center gap-4">
		<h1>{APP_NAME}</h1>
		<p class="landing-tagline">
			{APP_NAME} is a local-first object-oriented GUI client for blockchain
			exploration, DeFi and AI agents.
		</p>
		<nav aria-label="Primary actions" data-column="center gap-3">
			<a
				href={resolve(primaryCta.href)}
				data-card="border-accent padding-4 radius-4"
				data-column="gap-1 center"
				class="landing-cta-primary"
			>
				<span>{primaryCta.label}</span>
			</a>
			<div data-row="center wrap gap-2">
				{#each secondaryCtas as { href, label }}
					<a data-link href={resolve(href)}>{label}</a>
				{/each}
			</div>
		</nav>

		{#if previewRoot}
			<a
				href={resolve('/dashboard')}
				class="landing-dashboard-preview"
				aria-label="Open dashboard"
			>
				<div class="landing-dashboard-preview-inner">
					<PanelTree
						root={previewRoot}
						focusedPanelId={previewFocusedPanelId}
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
			</a>
		{/if}
	</header>

	<section
		class="landing-routes"
		data-scroll-item
		data-column="center gap-4"
		aria-label="All routes"
	>
		<h2 class="landing-routes-title">Explore</h2>
		<nav
			aria-label="App routes"
			data-grid="columns-autofit gap-3 column-min-8"
		>
			{#each routes as { href, title }}
				<a
					href={resolve(href)}
					data-card="padding-3 radius-3"
					data-column="gap-1"
					class="landing-route-card"
				>
					<span>{title}</span>
				</a>
			{/each}
		</nav>
	</section>

	<section
		id="about"
		class="landing-about"
		data-scroll-item
		data-column="gap-4"
		aria-label="About"
	>
		<header class="landing-about__header" data-column="gap-2">
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
			data-column="gap-2"
			aria-label="Diagram legend"
		>
			<h3>Legend</h3>
			<div data-grid="columns-autofit column-min-12 gap-3" class="landing-about__legend-grid">
				{#each legendItems as item (item.id)}
					<div class="landing-about__legend-item" data-row="start gap-2">
						<span
							class="landing-about__legend-swatch"
							data-row="center"
							style:background={item.color}
							data-shape="rect"
						></span>
						<span>{item.label}</span>
					</div>
				{/each}
			</div>

			<div data-grid="columns-autofit column-min-12 gap-3" class="landing-about__legend-grid">
				<div class="landing-about__legend-item" data-row="start gap-2">
					<span class="landing-about__legend-swatch" data-row="center" data-shape="rect"></span>
					<span>Flow / service node</span>
				</div>
				<div class="landing-about__legend-item" data-row="start gap-2">
					<span class="landing-about__legend-swatch" data-row="center" data-shape="circle"></span>
					<span>State or data node</span>
				</div>
				<div class="landing-about__legend-item" data-row="start gap-2">
					<span class="landing-about__legend-swatch" data-row="center" data-shape="diamond"></span>
					<span>Wallet / channel node</span>
				</div>
				<div class="landing-about__legend-item" data-row="start gap-2">
					<span class="landing-about__legend-swatch" data-row="center" data-shape="image"></span>
					<span>Chain icon node</span>
				</div>
				<div class="landing-about__legend-item" data-row="start gap-2">
					<span class="landing-about__legend-swatch" data-row="center" data-shape="line"></span>
					<span>Directional flow</span>
				</div>
				<div class="landing-about__legend-item" data-row="start gap-2">
					<span class="landing-about__legend-swatch" data-row="center" data-shape="dashed"></span>
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


<style>
	.landing {
		padding-block: clamp(2rem, 10vh, 4rem);
		padding-inline: 1rem;
	}

	.landing-hero {
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
	}

	.landing-hero h1 {
		font-size: clamp(2rem, 5vw, 2.75rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
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

	.landing-tagline {
		max-inline-size: 42ch;
		color: var(--color-text-muted);
		font-size: 1.1rem;
		line-height: 1.5;
	}

	.landing-cta-primary {
		text-decoration: none;
		color: var(--color-accent);
		font-weight: 600;
		transition: background-color 0.2s ease, box-shadow 0.2s ease;
		box-shadow: var(--shadow-sm);
	}

	.landing-cta-primary:hover {
		background-color: var(--color-accent-bg);
		box-shadow: var(--shadow-md);
	}

	.landing-hero nav > div {
		padding-block-start: 0.25rem;
	}

	.landing-hero nav > div a {
		padding: 0.35em 0.5em;
		border-radius: 0.35em;
	}

	.landing-hero nav > div a:hover {
		background-color: var(--color-bg-muted);
	}

	.landing-dashboard-preview {
		display: block;
		text-decoration: none;
		color: inherit;
		margin-block-start: 2rem;
		perspective: 1200px;
		transform-style: preserve-3d;
	}

	.landing-dashboard-preview-inner {
		position: relative;
		display: block;
		width: min(90vw, 42rem);
		height: min(50vh, 20rem);
		margin-inline: auto;
		transform: rotateX(10deg) rotateY(-6deg) scale(0.92);
		transform-style: preserve-3d;
		border-radius: 0.5rem;
		box-shadow:
			0 25px 50px -12px rgb(0 0 0 / 0.2),
			0 0 0 1px var(--color-border);
		overflow: hidden;
		transition: transform 0.35s ease, box-shadow 0.35s ease;
		pointer-events: none;
	}

	.landing-dashboard-preview:hover .landing-dashboard-preview-inner {
		transform: rotateX(6deg) rotateY(-4deg) scale(0.95);
		box-shadow:
			0 32px 64px -12px rgb(0 0 0 / 0.25),
			0 0 0 1px var(--color-border);
	}

	.landing-dashboard-preview-inner :global(.split-tree),
	.landing-dashboard-preview-inner :global(.dashboard-panel) {
		height: 100%;
		min-height: 0;
	}

	.landing-dashboard-preview-inner :global(.dashboard-panel) {
		font-size: 0.875rem;
	}

	.landing-dashboard-preview-inner :global(.dashboard-panel header) {
		padding: 0.35rem 0.5rem;
		gap: 0.35rem;
	}

	.landing-dashboard-preview-inner :global(.dashboard-panel-route),
	.landing-dashboard-preview-inner :global(.dashboard-panel-hash) {
		min-width: 0;
		font-size: 0.75rem;
	}

	.landing-dashboard-preview-inner :global(.dashboard-panel-history) {
		display: none;
	}

	.landing-routes {
		view-timeline: --routes block;
		animation: routes-reveal linear;
		animation-timeline: view(--routes);
		animation-range: entry 5% entry 40%;
		animation-fill-mode: both;
		padding-block: 3rem 1rem;
		border-block-start: 1px solid var(--color-border);
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

	.landing-routes-title {
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
		margin-block-end: 0.5rem;
	}

	.landing-route-card {
		text-decoration: none;
		color: inherit;
		transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
		border: 1px solid transparent;
	}

	.landing-route-card:hover {
		background-color: var(--color-bg-muted);
		box-shadow: var(--shadow-sm);
		border-color: var(--color-border);
	}

	.landing-about {
		width: 100%;
		padding-block: 3rem 1rem;
		border-block-start: 1px solid var(--color-border);
	}

	.landing-about__header {
		max-width: 46rem;
	}

	.landing-about__legend {
		gap: 1.5rem;
	}

	.landing-about__legend-grid {
		column-gap: 1.5rem;
	}

	.landing-about__legend-item {
		font-size: 0.9rem;
	}

	.landing-about__legend-swatch {
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 0.25rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-subtle);
	}

	.landing-about__legend-swatch[data-shape='circle'] {
		border-radius: 50%;
	}

	.landing-about__legend-swatch[data-shape='diamond'] {
		transform: rotate(45deg);
	}

	.landing-about__legend-swatch[data-shape='image'] {
		border-style: dashed;
	}

	.landing-about__legend-swatch[data-shape='line'] {
		width: 1.6rem;
		height: 0.2rem;
		border: none;
		background: var(--color-text);
	}

	.landing-about__legend-swatch[data-shape='dashed'] {
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

	.landing-about__legend-details {
		font-size: 0.875rem;
	}

	.landing-about__legend-details dt {
		font-weight: 600;
	}

	.landing-about__legend-details dd {
		margin: 0;
	}

	.landing-about__diagram {
		width: 100%;
		min-height: 460px;
	}
</style>
