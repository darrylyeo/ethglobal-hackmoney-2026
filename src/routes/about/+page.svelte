<script lang="ts">
	// Context
	import { resolve } from '$app/paths'
</script>


<div data-column="center gap-4">
	<h1>About</h1>
	<p>
		USDC Tools is a SvelteKit app for bridging, swapping, and tracking USDC
		across supported chains.
	</p>
	<section data-column="gap-2">
		<h2>Core systems</h2>
		<ul data-list="gap-1">
			<li>TanStack DB collections for normalized state</li>
			<li>Voltaire RPC + ABI registry for onchain access</li>
			<li>LI.FI routing for bridge and swap quotes</li>
			<li>Circle CCTP for USDC transfers</li>
			<li>PartyKit rooms for realtime collaboration</li>
		</ul>
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
</div>
