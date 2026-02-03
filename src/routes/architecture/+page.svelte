<script lang="ts">
	// Context
	import { resolve } from '$app/paths'

	// Components
	import ArchitectureGraph from './ArchitectureGraph.svelte'
</script>

<svelte:head>
	<title>Architecture | USDC Tools</title>
</svelte:head>

<div data-column="center gap-4">
	<h1>Architecture</h1>
	<p>
		This diagram shows how the app’s major systems and data flows connect:
		client UI, state (TanStack DB), blockchain access (Voltaire), bridge and
		swap (LI.FI, Circle CCTP), realtime rooms (PartyKit), price feeds (Stork),
		payments (Yellow), wallets, and supported networks. Use it as a reference
		for the stack and runtime dependencies.
	</p>
	<section data-column="gap-2" class="legend" aria-label="Diagram legend">
		<h2>Legend</h2>
		<dl data-row="wrap gap-x-4 gap-y-1">
			<dt>Nodes</dt>
			<dd>
				Rectangle = Client/UI or State; diamond = service (RPC, LI.FI, CCTP,
				PartyKit, Stork, Yellow, Wallets); circle with icon = supported chain.
			</dd>
			<dt>Edges</dt>
			<dd>
				Arrows show data flow. Thicker blue edges = critical path (wallet ↔ UI,
				wallet → chains).
			</dd>
			<dt>Interactions</dt>
			<dd>
				Drag canvas to pan; use <kbd>+</kbd> / <kbd>−</kbd> to zoom, arrow keys
				to pan, <kbd>Escape</kbd> to clear selection. Hover for details.
			</dd>
		</dl>
	</section>
	<section class="diagram-section" aria-label="Architecture diagram">
		<ArchitectureGraph />
	</section>
</div>

<style>
	.legend dl {
		font-size: 0.875rem;
	}
	.legend dt {
		font-weight: 600;
	}
	.legend dd {
		margin: 0;
	}
	.diagram-section {
		width: 100%;
		height: 60vh;
		min-height: 400px;
	}
</style>
