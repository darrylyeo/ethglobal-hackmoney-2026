<script lang="ts">
	// Types/constants
	import { architectureGraph } from './architecture-graph'


	// Components
	import ArchitectureGraph from './ArchitectureGraph.svelte'


	// (Derived)
	const legendItems = [
		{
			id: 'client',
			label: 'Client UI',
			color: architectureGraph.layerColors.client,
		},
		{
			id: 'state',
			label: 'State + Collections',
			color: architectureGraph.layerColors.state,
		},
		{
			id: 'services',
			label: 'Services + Protocols',
			color: architectureGraph.layerColors.services,
		},
		{
			id: 'external',
			label: 'External APIs',
			color: architectureGraph.layerColors.external,
		},
		{
			id: 'networks',
			label: 'Networks',
			color: architectureGraph.layerColors.networks,
		},
		{
			id: 'tooling',
			label: 'Tooling',
			color: architectureGraph.layerColors.tooling,
		},
	]
</script>


<svelte:head>
	<title>About | USDC Tools</title>
</svelte:head>


<section class="about" data-scroll-item data-column="gap-4">
	<header class="about__header" data-column="gap-2">
		<h1>About</h1>
		<p>
			USDC Tools is a SvelteKit app for bridging, swapping, and tracking USDC
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
		<div class="about__legend-grid">
			{#each legendItems as item (item.id)}
				<div class="about__legend-item">
					<span
						class="about__legend-swatch"
						style:background={item.color}
						data-shape="rect"
					></span>
					<span>{item.label}</span>
				</div>
			{/each}
		</div>

		<div class="about__legend-grid">
			<div class="about__legend-item">
				<span class="about__legend-swatch" data-shape="rect"></span>
				<span>Flow / service node</span>
			</div>
			<div class="about__legend-item">
				<span class="about__legend-swatch" data-shape="circle"></span>
				<span>State or data node</span>
			</div>
			<div class="about__legend-item">
				<span class="about__legend-swatch" data-shape="diamond"></span>
				<span>Wallet / channel node</span>
			</div>
			<div class="about__legend-item">
				<span class="about__legend-swatch" data-shape="image"></span>
				<span>Chain icon node</span>
			</div>
			<div class="about__legend-item">
				<span class="about__legend-swatch" data-shape="line"></span>
				<span>Directional flow</span>
			</div>
			<div class="about__legend-item">
				<span class="about__legend-swatch" data-shape="dashed"></span>
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



<style>
	.about__header {
		max-width: 46rem;
	}

	.about {
		width: 100%;
	}

	.about__legend {
		display: grid;
		gap: 1.5rem;
	}

	.about__legend-grid {
		display: grid;
		gap: 0.75rem 1.5rem;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
	}

	.about__legend-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.9rem;
	}

	.about__legend-swatch {
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 0.25rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-subtle);
		display: inline-flex;
		align-items: center;
		justify-content: center;

		&[data-shape='circle'] {
			border-radius: 50%;
		}

		&[data-shape='diamond'] {
			transform: rotate(45deg);
		}

		&[data-shape='image'] {
			border-style: dashed;
		}

		&[data-shape='line'] {
			width: 1.6rem;
			height: 0.2rem;
			border: none;
			background: var(--color-text);
		}

		&[data-shape='dashed'] {
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
