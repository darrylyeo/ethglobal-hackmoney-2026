<script lang="ts">
	// Context
	import { resolve } from '$app/paths'
</script>


<div 
	data-column="center gap-4"
>
	<h1>USDC Tools</h1>
	<p>Bridge and track USDC across supported chains.</p>
	<nav aria-label="App routes">
		<ul data-list="gap-2">
			<li>
				<a href={resolve('/bridge')}>Bridge</a>
			</li>
			<li>
				<a href={resolve('/transfers')}>Transfers</a>
			</li>
			<li>
				<a href={resolve('/about')}>About</a>
			</li>
			<li>
				<a href={resolve('/test/collections')}>Test collections</a>
			</li>
		</ul>
	</nav>
</div>
