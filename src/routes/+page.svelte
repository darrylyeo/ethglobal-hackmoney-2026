<script lang="ts">
	// Context
	import { resolve } from '$app/paths'

	const routes = [
		{ href: '/about', title: 'About' },
		{ href: '/dashboard', title: 'Dashboard' },
		{ href: '/accounts', title: 'Accounts' },
		{ href: '/sessions', title: 'Sessions' },
		{ href: '/session#bridge', title: 'Bridge' },
		{ href: '/session#swap', title: 'Swap' },
		{ href: '/session#transfer', title: 'Transfer' },
		{ href: '/session#liquidity', title: 'Liquidity' },
		{ href: '/coin/USDC', title: 'USDC' },
		{ href: '/rooms', title: 'Rooms' },
		{ href: '/test/collections', title: 'Tests' },
	]
</script>


<div data-column="center gap-4">
	<h1>USDC Tools</h1>
	<p>Bridge and track USDC across supported chains.</p>
	<nav aria-label="App routes" class="route-cards">
		{#each routes as { href, title }}
			<a href={resolve(href)} data-card data-column="gap-1">
				<span>{title}</span>
			</a>
		{/each}
	</nav>
</div>



<style>
	.route-cards {
		display: grid;
		gap: 1em;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
	}

	.route-cards > a {
		text-decoration: none;
		color: inherit;
	}
</style>
