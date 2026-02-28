<script lang="ts">
	// Types/constants
	import { APP_NAME } from '$/constants/app.ts'
	import { sessionTemplates } from '$/data/Session.ts'
	import { resolve } from '$app/paths'
</script>


<svelte:head>
	<title>Actions – {APP_NAME}</title>
</svelte:head>


<main data-column="center gap-4">
	<h1>Actions</h1>
	<p data-text="muted">Choose an action to start a session.</p>

	<nav
		aria-label="Session actions"
		data-grid="columns-autofit"
		class="route-cards"
	>
		{#each sessionTemplates as template}
			<a
				href={resolve(`/session?template=${template.actions[0].type}`)}
				data-card
				data-column
			>
				<span>{template.name}</span>
			</a>
		{/each}
	</nav>
</main>


<style>
	.route-cards > a {
		text-decoration: none;
		color: inherit;
	}
</style>
