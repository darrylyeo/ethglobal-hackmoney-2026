<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'

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

	// Functions
	import { stringify } from '$/lib/stringify.ts'

	function errorDisplayText(error: unknown): string {
		if (error instanceof Error)
			return error.stack ?? `${error.name}: ${error.message}`
		return stringify(error ?? null, null, 2)
	}
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
				data-row
				class="loading"
			>
				<p>
					Loading...
				</p>
			</div>
		{/if}
	{/snippet}

	{#snippet failed(error, retry)}
		{@const _ = (console.error(error), null)}

		{#if Failed}
			{@render Failed(error, retry)}
		{:else}
			<div
				data-card
				class="error-card"
			>
				<header data-row="wrap">
					<div
						data-row="start"
						data-row-item="flexible"
					>
						<h3>
							{error instanceof Error ? error.name : 'Error'}
						</h3>
					</div>

					<div
						data-row
						class="error-actions"
					>
						<button
							type="button"
							onclick={() => navigator.clipboard.writeText(errorDisplayText(error))}
						>
							Copy
						</button>

						{#if retry}
							<button
								type="button"
								onclick={retry}
							>
								Retry
							</button>
						{/if}
					</div>
				</header>

				<div class="error-content">
					{#if error instanceof Error}
						<p class="error-message">{error.message}</p>
						{#if error.stack}
							<details class="error-stack">
								<summary>
									Stack trace
								</summary>
								<pre>{error.stack}</pre>
							</details>
						{/if}
					{:else}
						<pre>{stringify(error ?? null, null, 2)}</pre>
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

	.error-actions {
		gap: 0.5em;
	}

	.error-content pre,
	.error-content .error-message {
		overflow: auto;
		min-width: 100%;
		width: 0;
	}

	.error-content pre {
		font-size: smaller;
	}

	.error-stack summary {
		cursor: pointer;
	}

	:global(body.svelte-inspector-enabled) div {
		pointer-events: none;
	}
</style>
