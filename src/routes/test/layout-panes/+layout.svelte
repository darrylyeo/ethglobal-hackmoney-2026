<script lang="ts">
	// Props
	let { children } = $props()


	// Styles
	import '$/styles/reset.css'
	import '$/styles/colors.css'
	import '$/styles/fonts.css'
	import '$/styles/components.css'
</script>


<div
	class="panes-test"
	data-scroll-container="layout-inline-panes"
	data-sticky-container
>
	<aside
		id="aside"
		data-scroll-iwtem="pane-static"
	>
		<a href="#main">
			Scroll to main
		</a>
		<p>
			Aside
		</p>
	</aside>

	<main
		id="main"
		data-scroll-item="pane-flexible"
		data-column
		data-sticky-container
	>
		<a href="#aside">
			Scroll to aside
		</a>
		{@render children()}
	</main>
</div>


<style>
	.panes-test {
		width: 100%;
		min-block-size: 60dvh;
	}
</style>
