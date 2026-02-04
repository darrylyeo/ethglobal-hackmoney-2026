<script lang="ts">
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

	const a11yLabel = label ?? alt
	const resolvedTitle = title ?? (alt || undefined)
</script>

<span
	{...rootProps}
	class={`icon${className ? ` ${className}` : ''}`}
	style={`--icon-size: ${typeof size === 'number' ? `${size}px` : size}`}
	aria-label={a11yLabel || undefined}
	aria-hidden={a11yLabel ? undefined : true}
	title={resolvedTitle}
	role={a11yLabel ? 'img' : undefined}
>
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

<style>
	.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--icon-size);
		height: var(--icon-size);
		line-height: 1;

		:global(img),
		:global(svg) {
			width: 100%;
			height: 100%;
			object-fit: contain;
			border-radius: inherit;
		}
	}
</style>
