<script lang="ts">
	// Props
	let { children } = $props()


	// Images
	import favicon from '$/lib/assets/favicon.svg'


	// Styles
	import '$/styles/colors.css'
	import '$/styles/bits-ui.css'
</script>


<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
