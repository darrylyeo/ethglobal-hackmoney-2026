<script lang="ts">
	// Types/constants
	import type { ShjLanguage } from '$/lib/syntax-highlight.ts'

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

	// Functions
	import {
		highlightElementForPath,
		highlightElementWithLang,
		langForPath,
	} from '$/lib/syntax-highlight.ts'

	// State
	let preEl = $state<HTMLPreElement | null>(
		null,
	)

	// (Derived)
	$effect(() => {
		if (!preEl || !content) return
		(path
			? highlightElementForPath(preEl, path)
			: highlightElementWithLang(
				preEl,
				lang ?? (path ? langForPath(path) : 'plain'),
				withMultiline,
			)).catch(() => {})
	})

	// Styles
	import '@speed-highlight/core/themes/github-dark.css'
</script>


<pre
	bind:this={preEl}
	class="code-block shj-{withMultiline
		? 'multiline'
		: 'single'}{className
		? ` ${className}`
		: ''}"
	style="max-height: {typeof maxHeight === 'number'
		? `${maxHeight}px`
		: maxHeight}; overflow: auto; margin: 0; padding: 1em; tab-size: 4; white-space: pre;"
>{content}</pre>
