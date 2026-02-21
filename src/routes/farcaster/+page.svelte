<script lang="ts">
	// Context
	import { page } from '$app/state'

	// (Derived)
	const siwfDomain = $derived(
		page.url.hostname || 'localhost',
	)
	const siwfUri = $derived(
		`${page.url.origin}/farcaster`,
	)

	// Components
	import FarcasterDashboard from './FarcasterDashboard.svelte'
	import SignInWithFarcaster from '$/components/SignInWithFarcaster.svelte'
</script>


<svelte:head>
	<title>Farcaster</title>
</svelte:head>


<main class="farcaster-page" data-column="gap-4">
	<header data-row="gap-4 wrap" data-scroll-container="inline">
		<h1>Farcaster</h1>
		<SignInWithFarcaster domain={siwfDomain} siweUri={siwfUri} />
	</header>
	<FarcasterDashboard />
</main>


<style>
	.farcaster-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		min-height: 0;
	}
</style>
