<script lang="ts">
	// Types/constants
	import { APP_NAME } from '$/constants/app.ts'
	import {
		formatSocialPostSessionPlaceholderName,
		socialPostSessionFromInput,
		type SocialPostSessionInput,
	} from '$/lib/session/socialPostSessionUrl.ts'


	// Props
	let {
		data,
	}: {
		data: SocialPostSessionInput & {
			urlKey?: string
			setPanelRoute?: (path: string, params: Record<string, string>) => void
		}
	} = $props()


	// (Derived)
	const initialSession = $derived(socialPostSessionFromInput(data))
	const setPanelRoute = $derived(data.setPanelRoute)
	const urlKey = $derived(data.urlKey ?? '')


	// Components
	import SocialPostSessionLocal from './SocialPostSessionLocal.svelte'
</script>

<svelte:head>
	<title>
		{initialSession
			? (initialSession.name ?? formatSocialPostSessionPlaceholderName(initialSession.actions))
			: 'Social post'}
		– {APP_NAME}
	</title>
</svelte:head>

<main data-column data-sticky-container>
	{#if initialSession}
		{#key urlKey}
			<SocialPostSessionLocal
				initialSession={initialSession}
				{setPanelRoute}
			/>
		{/key}
	{:else}
		<section data-scroll-item data-column="gap-3">
			<header data-row="wrap gap-4">
				<h1>Social post</h1>
			</header>
			<p data-text="muted">Loading…</p>
		</section>
	{/if}
</main>
