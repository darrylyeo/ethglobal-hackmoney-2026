<script lang="ts">
	// Context
	import { resolve } from '$app/paths'

	// Components
	import ArchitectureGraph from './ArchitectureGraph.svelte'
</script>

<svelte:head>
	<title>About | USDC Tools</title>
</svelte:head>

<section data-scroll-item data-column="center gap-4">
	<h1>About</h1>
	<p>
		USDC Tools is a SvelteKit app for bridging, swapping, and tracking USDC
		across supported chains. It combines TanStack DB collections, Voltaire
		(Ethereum RPC + ABIs), LI.FI routing, Circle CCTP, and realtime
		collaboration with PartyKit. The architecture diagram covers runtime systems
		plus the tooling that builds, tests, and ships the app.
	</p>
	<section data-column="gap-2">
		<h2>Core systems</h2>
		<ul data-list="gap-1">
			<li>SvelteKit UI flows + visualization layers</li>
			<li>Svelte state + TanStack DB collections</li>
			<li>Wallet discovery, signing, and chain switching</li>
			<li>Voltaire RPC + ABI helpers</li>
			<li>LI.FI bridge + swap routing</li>
			<li>Circle CCTP messaging + attestations</li>
			<li>Uniswap v4 swaps + liquidity</li>
			<li>Transfers pipeline (logs + indexer)</li>
			<li>PartyKit realtime rooms</li>
			<li>Stork price feeds</li>
			<li>Yellow state channels + custody</li>
			<li>Explain fallback (Prompt API + hosted LLM)</li>
			<li>Build, test, and tooling scripts</li>
		</ul>
	</section>
	<section data-column="gap-2" class="legend" aria-label="Diagram legend">
		<h2>Architecture diagram</h2>
		<dl data-row="wrap gap-x-4 gap-y-1">
			<dt>Nodes</dt>
			<dd>
				Rectangles = UI, state, collections, storage, tooling; diamonds =
				services + external dependencies; circles with icons = supported chains.
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
	<section
		id="explain-results-fallback"
		data-column="gap-2"
		aria-label="Explain results fallback"
	>
		<h2>Explain results fallback</h2>
		<p>
			Enable the hosted explanation fallback by setting the following env vars:
		</p>
		<ul data-list="gap-1">
			<li><code>PUBLIC_EXPLAIN_LLM_ENDPOINT</code></li>
			<li><code>PUBLIC_EXPLAIN_LLM_API_KEY</code> (optional)</li>
		</ul>
	</section>
	<section data-column="gap-2">
		<h2>Navigation</h2>
		<ul data-list="gap-1">
			<li><a href={resolve('/bridge')}>Bridge</a></li>
			<li><a href={resolve('/swap')}>Swap</a></li>
			<li><a href={resolve('/explore/usdc')}>USDC</a></li>
			<li><a href={resolve('/rooms')}>Rooms</a></li>
		</ul>
	</section>
</section>

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
		min-height: 420px;
	}
</style>
