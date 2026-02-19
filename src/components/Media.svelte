<script lang="ts">
	// Types/constants
	import type { Media, MediaObject } from '$/constants/media.ts'
	import { MediaType } from '$/constants/media.ts'


	// Props
	let {
		media,
		size = 'medium',
		alt = '',
		loading = 'lazy',
	}: {
		media: Media | { url: string } | undefined
		size?: 'thumbnail' | 'low' | 'medium' | 'high' | 'original'
		alt?: string
		loading?: 'lazy' | 'eager'
	} = $props()


	// (Derived)
	const getUrl = (m: Media | { url: string } | undefined): string | undefined =>
		m && 'url' in m ? m.url : undefined
	const isFullMedia = (m: Media | { url: string } | undefined): m is Media =>
		!!m && 'type' in m && 'original' in m
	const format = $derived(
		isFullMedia(media)
			? size === 'original'
				? media.original
				: size === 'high'
					? media.high
					: size === 'medium'
						? media.medium
						: size === 'low'
							? media.low
							: size === 'thumbnail'
								? media.thumbnail
								: media.original
			: undefined,
	)
	const url = $derived(
		format?.url ?? (media && 'url' in media ? media.url : undefined),
	)
	const mediaType = $derived(
		isFullMedia(media) ? media.type : inferTypeFromUrl(url),
	)
	const width = $derived(format?.width)
	const height = $derived(format?.height)

	function inferTypeFromUrl(u: string | undefined): MediaType {
		if (!u) return MediaType.Other
		const path = u.split('?')[0].toLowerCase()
		if (/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i.test(path)) return MediaType.Image
		if (/\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(path)) return MediaType.Video
		if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(path)) return MediaType.Audio
		return MediaType.Other
	}
</script>

{#if url}
	{#if mediaType === MediaType.Image}
		<figure>
			<img
				src={url}
				alt={alt}
				width={width}
				height={height}
				loading={loading}
			/>
		</figure>
	{:else if mediaType === MediaType.Video}
		<!-- svelte-ignore a11y_media_has_caption -->
		<figure>
			<video
				src={url}
				width={width}
				height={height}
				controls
				preload={loading === 'eager' ? 'auto' : 'metadata'}
			>
				{alt}
			</video>
		</figure>
	{:else if mediaType === MediaType.Audio}
		<figure>
			<audio src={url} controls preload={loading === 'eager' ? 'auto' : 'metadata'}>
				{alt}
			</audio>
		</figure>
	{:else}
		<figure>
			<a href={url} target="_blank" rel="noopener noreferrer" data-text="annotation">
				{url}
			</a>
		</figure>
	{/if}
{/if}

<style>
	figure {
		margin: 0;
		padding: 0;
		display: block;
	}

	img,
	video {
		display: block;
		max-width: 100%;
		height: auto;
		object-fit: contain;
	}

	video {
		background: var(--color-surface-2, #f1f5f9);
	}

	audio {
		width: 100%;
	}
</style>
