<script lang="ts">
	// Types/constants
	import { APP_NAME } from '$/constants/app.ts'
	import { layerColors } from '$/views/architecture-graph.ts'

	const legendItems = [
		{
			id: 'client',
			label: 'Client UI',
			color: layerColors.client,
		},
		{
			id: 'state',
			label: 'State + Collections',
			color: layerColors.state,
		},
		{
			id: 'services',
			label: 'Services + Protocols',
			color: layerColors.services,
		},
		{
			id: 'external',
			label: 'External APIs',
			color: layerColors.external,
		},
		{
			id: 'networks',
			label: 'Networks',
			color: layerColors.networks,
		},
		{
			id: 'tooling',
			label: 'Tooling',
			color: layerColors.tooling,
		},
	]


	// Components
	import ArchitectureGraph from '$/views/ArchitectureGraph.svelte'
</script>


<svelte:head>
	<title>About | {APP_NAME}</title>
</svelte:head>


<main>
	<section
		class="about"
		data-scroll-item
		data-column="gap-4"
	>
	<header class="about__header" data-column="gap-2">
		<h1>About</h1>
		<p>
			{APP_NAME} is a SvelteKit app for bridging, swapping, and tracking USDC
			across supported chains. It combines TanStack DB collections, Voltaire
			(RPC + ABI helpers), LI.FI routing, Circle CCTP, realtime PartyKit rooms,
			Yellow state channels, and Stork price feeds. The diagram below maps
			runtime systems, data flows, and external dependencies.
		</p>
	</header>

	<section class="diagram-section" aria-label="Architecture diagram">
		<ArchitectureGraph height="72vh" />
	</section>

	<section
		class="about__legend"
		data-card
		data-column="gap-2"
		aria-label="Diagram legend"
	>
		<h2>Legend</h2>
		<div data-grid="columns-autofit column-min-12 gap-3" class="about__legend-grid">
			{#each legendItems as item (item.id)}
				<div class="about__legend-item" data-row="start gap-2">
					<span
						class="about__legend-swatch shape-rect"
						data-row
						style:background={item.color}
					></span>
					<span>{item.label}</span>
				</div>
			{/each}
		</div>

		<div data-grid="columns-autofit column-min-12 gap-3" class="about__legend-grid">
			<div class="about__legend-item" data-row="start gap-2">
				<span class="about__legend-swatch shape-rect" data-row></span>
				<span>Flow / service node</span>
			</div>
			<div class="about__legend-item" data-row="start gap-2">
				<span class="about__legend-swatch shape-circle" data-row></span>
				<span>State or data node</span>
			</div>
			<div class="about__legend-item" data-row="start gap-2">
				<span class="about__legend-swatch shape-diamond" data-row></span>
				<span>Wallet / channel node</span>
			</div>
			<div class="about__legend-item" data-row="start gap-2">
				<span class="about__legend-swatch shape-image" data-row></span>
				<span>Chain icon node</span>
			</div>
			<div class="about__legend-item" data-row="start gap-2">
				<span class="about__legend-swatch shape-line" data-row></span>
				<span>Directional flow</span>
			</div>
			<div class="about__legend-item" data-row="start gap-2">
				<span class="about__legend-swatch shape-dashed" data-row></span>
				<span>Optional / enrichment path</span>
			</div>
		</div>
		<dl class="about__legend-details" data-row="wrap gap-x-4 gap-y-1">
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
		</dl>
	</section>
	</section>
</main>


<style>
	.about__header {
		max-width: 46rem;
	}

	.about {
		width: 100%;
	}

	.about__legend {
		gap: 1.5rem;
	}

	.about__legend-grid {
		column-gap: 1.5rem;
	}

	.about__legend-item {
		font-size: 0.9rem;
	}

	.about__legend-swatch {
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

	.about__legend-details {
		font-size: 0.875rem;

		dt {
			font-weight: 600;
		}

		dd {
			margin: 0;
		}
	}

	.diagram-section {
		width: 100%;
		min-height: 460px;
	}
</style>
