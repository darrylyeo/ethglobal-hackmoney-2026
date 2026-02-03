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
		(Ethereum RPC + ABIs), LI.FI routing, Circle CCTP, and realtime collaboration
		with PartyKit.
	</p>
	<section data-column="gap-2">
		<h2>Core systems</h2>
		<ul data-list="gap-1">
			<li>TanStack DB collections + live queries</li>
			<li>Voltaire RPC + ABI registry</li>
			<li>LI.FI bridge + swap routes</li>
			<li>Circle CCTP bridge kit</li>
			<li>Uniswap v4 swap + liquidity</li>
			<li>Transfers data (logs + indexer fallback)</li>
			<li>PartyKit rooms</li>
			<li>Stork price feeds</li>
			<li>Yellow state channels</li>
		</ul>
	</section>
	<section data-column="gap-2" class="legend" aria-label="Diagram legend">
		<h2>Architecture diagram</h2>
		<dl data-row="wrap gap-x-4 gap-y-1">
			<dt>Nodes</dt>
			<dd>
				Rectangle = Client/UI or State; diamond = service (Voltaire, LI.FI,
				CCTP, Uniswap, Transfers, PartyKit, Stork, Yellow, Wallets); circle with
				icon = supported chain.
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
	<section data-column="gap-2">
		<h2>Navigation</h2>
		<ul data-list="gap-1">
			<li><a href={resolve('/bridge')}>Bridge</a></li>
			<li><a href={resolve('/swap')}>Swap</a></li>
			<li><a href={resolve('/transfers')}>Transfers</a></li>
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
