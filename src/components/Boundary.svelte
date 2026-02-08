<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'


	// Functions
	import { stringify } from '$/lib/stringify.ts'


	// Props
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
			<div data-card data-row class="loading">
				<p>Loading...</p>
			</div>
		{/if}
	{/snippet}

	{#snippet failed(error, retry)}
		{#if Failed}
			{@render Failed(error, retry)}
		{:else}
			<div data-card>
				<header data-row="wrap gap-2">
					<div data-row="start gap-2" data-row-item="flexible">
						<h3>Error</h3>
					</div>
					<div data-row="gap-2">
						<button onclick={retry}>Retry</button>
					</div>
				</header>

				<div class="error-content">
					{#if console.error(error) || error instanceof Error}
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
			</div>
		{/if}
	{/snippet}
</svelte:boundary>


<style>
	.loading {
		cursor: wait;
	}

	.error-content pre,
	.error-content p {
		overflow: auto;
		min-width: 100%;
		width: 0;
	}

	.error-content pre {
		font-size: smaller;
	}

	:global(body.svelte-inspector-enabled) div {
		pointer-events: none;
	}
</style>
