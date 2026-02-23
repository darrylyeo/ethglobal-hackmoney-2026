<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'


	// Props
	let {
		title,
		href,
		open = true,
		annotation,
		detailsProps = {},
		Summary,
		Toolbar,
		children,
	}: {
		title: string
		href?: string
		open?: boolean
		annotation?: string
		detailsProps?: Record<string, unknown>
		Summary?: Snippet<[{ title: string; annotation?: string }]>
		Toolbar?: Snippet
		children?: Snippet
	} = $props()


	// Components
	import Heading from '$/components/Heading.svelte'
</script>


<section>
	<details data-card {open} {...detailsProps}>
		<summary>
			<div data-row="wrap">
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
			</div>
		</summary>

		{#if children}
			{@render children()}
		{/if}
	</details>
</section>
