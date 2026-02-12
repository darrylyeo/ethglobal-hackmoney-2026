<script lang="ts">
	// Types/constants
	import type { ShjLanguage } from '$/lib/syntax-highlight.ts'
	import {
		highlightElementForPath,
		highlightElementWithLang,
		langForPath,
	} from '$/lib/syntax-highlight.ts'


	// Styles
	import '@speed-highlight/core/themes/github-dark.css'


	// Props
	let {
		content,
		path,
		lang,
		withMultiline = true,
		maxHeight = '20em',
		className,
	}: {
		content: string
		path?: string
		lang?: ShjLanguage
		withMultiline?: boolean
		maxHeight?: string | number
		className?: string
	} = $props()


	// State
	let preEl = $state<HTMLPreElement | null>(null)


	// (Derived)
	const resolvedLang = $derived(lang ?? (path ? langForPath(path) : 'plain'))


	// Actions
	$effect(() => {
		if (!preEl || !content) return
		(path
			? highlightElementForPath(preEl, path)
			: highlightElementWithLang(preEl, resolvedLang, withMultiline),
		).catch(() => {})
	})
</script>


<pre
	bind:this={preEl}
	class="code-block shj-{withMultiline ? 'multiline' : 'single'}{className ? ` ${className}` : ''}"
	style="max-height: {typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight}; overflow: auto; margin: 0; padding: 1em; tab-size: 4; white-space: pre;"
>{content}</pre>
