<script lang="ts">
	// Types/constants
	import type { Match } from '$/lib/fuzzyMatch.ts'
	import { fuzzyMatch } from '$/lib/fuzzyMatch.ts'
	import { untrack } from 'svelte'
	import { SvelteSet } from 'svelte/reactivity'


	// Props
	let {
		text,
		query,
		matches,
	}: {
		text: string
		query: string
		matches?: SvelteSet<Match>
	} = $props()


	// Functions
	function escapeHtml(s: string): string {
		return s
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
	}
	function highlightRanges(escaped: string, ranges: Match[]): string {
		if (ranges.length === 0) return escaped
		const parts: string[] = []
		let last = 0
		for (const { start, end } of ranges) {
			if (start > last) parts.push(escaped.slice(last, start))
			parts.push('<mark>', escaped.slice(start, end), '</mark>')
			last = end
		}
		if (last < escaped.length) parts.push(escaped.slice(last))
		return parts.join('')
	}

	// (Derived)
	const matchRanges = $derived(fuzzyMatch(text, query))
	const html = $derived(
		highlightRanges(escapeHtml(text), matchRanges),
	)

	// State — ranges this instance added so we can remove then re-add (allows multiple SearchableText to share one Set)
	let previousRanges: Match[] = []
	// (Derived) — sync to parent Set when provided (untrack write to avoid effect loop)
	$effect(() => {
		if (!matches) return
		const ranges = fuzzyMatch(text, query)
		untrack(() => {
			for (const m of previousRanges) matches.delete(m)
			previousRanges = ranges
			for (const m of ranges) matches.add(m)
		})
	})
</script>


<span>{@html html}</span>


<style>
	span {
		:global(mark) {
			font-weight: 600;
			text-decoration: underline;
			background-color: transparent;
			color: inherit;
		}
	}
</style>
