<script lang="ts">
	// Types/constants
	import type { SessionInput } from '$/lib/session/sessionUrl.ts'
	import { APP_NAME } from '$/constants/app.ts'
	import {
		formatSessionPlaceholderName,
		sessionFromInput,
	} from '$/lib/session/sessionUrl.ts'


	// Props
	let {
		data,
	}: {
		data: SessionInput & { urlKey?: string; setPanelRoute?: (path: string, params: Record<string, string>) => void }
	} = $props()


	// (Derived)
	const initialSession = $derived(sessionFromInput(data))
	const urlKey = $derived(data.urlKey ?? '')
	const setPanelRoute = $derived(data.setPanelRoute)


	// Components
	import SessionLocal from './SessionLocal.svelte'
</script>


<svelte:head>
	<title>
		{initialSession
			? (initialSession.name ?? formatSessionPlaceholderName(initialSession.actions))
			: 'Session'}
		– {APP_NAME}
	</title>
</svelte:head>


<main
	id="main"
	data-column
	data-sticky-container
>
	{#if initialSession}
		{#key urlKey}
			<SessionLocal
				initialSession={initialSession}
				{setPanelRoute}
			/>
		{/key}
	{:else}
		<section
			data-scroll-item
			data-column="gap-3"
		>
			<header data-row="wrap gap-4">
				<div data-row="start gap-2" data-row-item="flexible">
					<h1>Session</h1>
				</div>
				<div data-row="gap-2">
					<span data-text="annotation">Session</span>
				</div>
			</header>
			<p data-text="muted">Loading session…</p>
		</section>
	{/if}
</main>
