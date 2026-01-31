<script lang="ts">
	// Props
	import type { Snippet } from 'svelte'
	import { stringify } from '$/lib/stringify'

	let {
		children,
		Pending,
		Failed,
	}: {
		children?: Snippet
		Pending?: Snippet
		Failed?: Snippet<[error: unknown, retry: () => void]>
	} = $props()
</script>


<svelte:boundary>
	{#if children}
		{@render children()}
	{/if}

	{#snippet pending()}
		{#if Pending}
			{@render Pending()}
		{:else}
			<div
				data-card
				data-row="center"
				class="loading"
			>
				<p>Loading...</p>
			</div>
		{/if}
	{/snippet}

	{#snippet failed(error, retry)}
		{console.error(error)}

		{#if Failed}
			{@render Failed(error, retry)}
		{:else}
			<div
				data-card="secondary"
				data-column="gap-1"
			>
				<header data-row="wrap">
					<h3>Error</h3>

					<button onclick={retry}>Retry</button>
				</header>

				{#if error instanceof Error}
					<p>{error.message}</p>

					{#if error.stack}
						<details>
							<summary>Stack trace</summary>
							<pre>{error.stack}</pre>
						</details>
					{/if}
				{:else}
					<pre>{stringify(error, null, 2)}</pre>
				{/if}
			</div>
		{/if}
	{/snippet}
</svelte:boundary>


<style>
	.loading {
		cursor: wait;
	}

	pre, p {
		overflow: auto;
		min-width: 100%;
		width: 0;
	}

	pre {
		font-size: smaller;
	}

	:global(body.svelte-inspector-enabled) div {
		pointer-events: none;
	}
</style>
