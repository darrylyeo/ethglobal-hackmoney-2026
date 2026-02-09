<script module lang="ts">
	export enum IconShape {
		Square = 'square',
		Circle = 'circle',
	}
	export type SubiconProps = {
		icon?: string
		html?: string
		src?: string
		alt?: string
		size?: number | string
		backgroundColor?: string
		shape?: IconShape
	}
</script>


<script lang="ts">
	// Components
	import Icon from './Icon.svelte'

	// Props
	let {
		class: className,
		icon,
		html,
		src,
		alt = '',
		label,
		title = undefined,
		size = '1em',
		shape = IconShape.Square,
		backgroundColor,
		subicon,
		loading = 'lazy',
		decoding = 'async',
		fetchPriority = 'auto',
		referrerPolicy = 'no-referrer',
		...rootProps
	}: {
		class?: string
		icon?: string
		html?: string
		src?: string
		alt?: string
		label?: string
		title?: string
		size?: number | string
		shape?: IconShape
		backgroundColor?: string
		subicon?: SubiconProps
		loading?: 'lazy' | 'eager'
		decoding?: 'async' | 'sync' | 'auto'
		fetchPriority?: 'auto' | 'high' | 'low'
		referrerPolicy?:
			| 'no-referrer'
			| 'no-referrer-when-downgrade'
			| 'origin'
			| 'origin-when-cross-origin'
			| 'same-origin'
			| 'strict-origin'
			| 'strict-origin-when-cross-origin'
			| 'unsafe-url'
		[key: string]: unknown
	} = $props()


	// (Derived)
	const a11yLabel = $derived(label ?? alt)
	const resolvedTitle = $derived(title ?? (alt || undefined))
</script>


<span
	{...rootProps}
	class={`icon${className ? ` ${className}` : ''}`}
	data-icon-shape={shape}
	data-row
	style={`--icon-size: ${typeof size === 'number' ? `${size}px` : size}${backgroundColor != null ? `; --icon-bg: ${backgroundColor}` : ''}`}
	aria-label={a11yLabel || undefined}
	aria-hidden={a11yLabel ? undefined : true}
	title={resolvedTitle}
	role={a11yLabel ? 'img' : undefined}
>
	<span data-row class="icon-main">
		{#if src}
			<img
				{src}
				{alt}
				width={typeof size === 'number' ? size : undefined}
				height={typeof size === 'number' ? size : undefined}
				{loading}
				{decoding}
				fetchpriority={fetchPriority}
				referrerpolicy={referrerPolicy}
			/>
		{:else if html}
			{@html html}
		{:else if icon}
			{icon}
		{/if}
	</span>

	{#if subicon}
		<Icon
			class="icon-subicon"
			{...subicon}
			size={subicon.size ?? '40%'}
			shape={subicon.shape ?? IconShape.Square}
			backgroundColor={subicon.backgroundColor}
		/>
	{/if}
</span>


<style>
	.icon {
		position: relative;
		width: var(--icon-size);
		height: var(--icon-size);
		line-height: 1;
		overflow: visible;
		background-color: var(--icon-bg, transparent);
		border-radius: inherit;

		&[data-icon-shape='square'] {
			border-radius: 5%;
		}
		&[data-icon-shape='circle'] {
			border-radius: 50%;
		}
	}

	.icon-main {
		position: absolute;
		inset: 0;
		overflow: hidden;
		border-radius: inherit;

		> :global(img),
		> :global(svg) {
			width: 100%;
			height: 100%;
			object-fit: contain;
			border-radius: inherit;
		}
	}

	.icon-subicon {
		position: absolute;
		inset-block-end: 0;
		inset-inline-end: 0;
		translate: 25% 25%;
	}
</style>
