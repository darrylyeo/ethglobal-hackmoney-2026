<script lang="ts">
	// Types/constants
	import { markdownToHtml } from '$/lib/markdown.ts'

	// Props
	let { content = '' }: { content: string } = $props()

	// (Derived)
	const html = $derived(markdownToHtml(content))
</script>


<div
	class="markdown"
	data-column="gap-4"
>
	{@html html}
</div>


<style>
	.markdown {
		:global(pre) {
			white-space: pre-wrap;
			word-break: break-word;
		}

		:global(code) {
			font-size: 0.9em;
		}

		:global(blockquote) {
			margin: 0;
			padding-inline-start: 1em;
			border-inline-start: 3px solid var(--color-border);
		}

		:global(table) {
			border-collapse: collapse;
			width: 100%;
		}

		:global(th),
		:global(td) {
			padding: 0.25em 0.5em;
			border: 1px solid var(--color-border);
			text-align: start;
		}

		:global(img) {
			max-width: 100%;
			height: auto;
		}
	}
</style>
