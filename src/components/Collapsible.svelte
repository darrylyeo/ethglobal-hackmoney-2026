<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'
	import { provideHeadingLevel } from '$/svelte/heading-context.ts'


	// Props
	let {
		title,
		href,
		open = true,
		annotation,
		detailsProps = {},
		incrementHeadingLevel = true,
		ontoggle,
		Summary,
		Toolbar,
		children,
	}: {
		title: string
		href?: string
		open?: boolean
		annotation?: string
		detailsProps?: Record<string, unknown>
		/** When false, summary heading uses current level (e.g. h1 for top-level entity card). Default true for nested sections. */
		incrementHeadingLevel?: boolean
		ontoggle?: (e: Event) => void
		Summary?: Snippet<[{ title: string; annotation?: string }]>
		Toolbar?: Snippet
		children?: Snippet
	} = $props()

	// Heading context set at init so Summary sees it; prop is stable (entity layout does not change at runtime).
	if (incrementHeadingLevel) provideHeadingLevel()


	// Components
	import Heading from '$/components/Heading.svelte'
</script>


<details
	data-card
	{open}
	{...detailsProps}
	data-scroll-container="block snap-block"
	ontoggle={ontoggle}
>
	<summary data-sticky>
		<!-- <div data-row="wrap"> -->
			{#if Summary}
				{@render Summary({ title, annotation })}
			{:else}
				<Heading>
					{#if href}
						<a href={href}>{title}</a>
					{:else}
						{title}
					{/if}
				</Heading>

				{#if Toolbar || annotation}
					<div data-row="wrap">
						{#if Toolbar}
							{@render Toolbar()}
						{/if}

						{#if annotation}
							<span data-text="annotation">{annotation}</span>
						{/if}
					</div>
				{/if}
			{/if}
		<!-- </div> -->
	</summary>

	{#if children}
		{@render children()}
	{/if}
</details>
