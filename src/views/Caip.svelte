<script lang="ts">
	// Types/constants
	import type { CaipEntry } from '$/data/CaipEntry.ts'
	import { fetchCaipBody } from '$/api/caips.ts'
	import Markdown from '$/components/Markdown.svelte'

	// Props
	let { entry }: { entry: CaipEntry } = $props()

	// State
	let body = $state<string | null>(null)
	let loadError = $state<Error | null>(null)
	let loading = $state(
		true
	)

	// (Derived)
	$effect(() => {
		const e = entry
		body = null
		loadError = null
		loading = true
		fetchCaipBody(e)
			.then((text) => {
				if (entry === e) {
					body = text
					loading = false
				}
			})
			.catch((err) => {
				if (entry === e) {
					loadError = err
					loading = false
				}
			})
	})
</script>


<p>
	<a
		href={entry.url}
		target="_blank"
		rel="noopener noreferrer"
		data-link
	>
		View on chainagnostic.org
	</a>
</p>

{#if loading}
	<p data-text="muted">Loading proposal content…</p>
{:else if loadError}
	<p data-text="muted">Could not load content: {loadError.message}</p>
{:else if body}
	<div class="caip-body" data-proposal-content>
		<Markdown content={body} />
	</div>
{/if}
