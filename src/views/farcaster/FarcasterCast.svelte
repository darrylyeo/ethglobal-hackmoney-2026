<script lang="ts">
	// Types/constants
	import type { FarcasterCastRow } from '$/collections/FarcasterCasts.ts'
	import type { FarcasterUserRow } from '$/collections/FarcasterUsers.ts'


	// Functions
	import { formatRelativeTime } from '$/lib/formatRelativeTime.ts'


	// Components
	import Media from '$/components/Media.svelte'


	// Props
	let {
		cast,
		userByFid,
		compact = false,
	}: {
		cast: FarcasterCastRow
		userByFid: Map<number, FarcasterUserRow>
		compact?: boolean
	} = $props()


	// (Derived)
	const author = $derived(userByFid.get(cast.$id.fid))
	const authorLabel = $derived(
		author?.username ? `@${author.username}` : `@${cast.$id.fid}`,
	)
	const castHref = $derived(`/farcaster/cast/${cast.$id.fid}/${cast.$id.hash}`)
</script>

{#if compact}
	<span data-row="gap-2 align-center">
		<span data-text="annotation">
			{authorLabel} · {formatRelativeTime(Date.now() - cast.timestamp * 1000)}
		</span>
		<span>{cast.text.slice(0, 80)}{cast.text.length > 80 ? '…' : ''}</span>
		<a href={castHref} data-text="annotation">View</a>
	</span>
{:else}
	<details
		data-card="radius-2 padding-4"
		id="cast:{cast.$id.fid}:{cast.$id.hash}"
	>
		<summary data-row="gap-2 align-center">
			<span data-text="annotation">
				{authorLabel} · {formatRelativeTime(Date.now() - cast.timestamp * 1000)}
			</span>
			<span>{cast.text.slice(0, 80)}{cast.text.length > 80 ? '…' : ''}</span>
			<a href={castHref} data-text="annotation">View</a>
		</summary>

		<div data-column="gap-4">
			<a href={castHref}>
				<p>{cast.text}</p>
			</a>
			{#if cast.embeds?.length}
				<ul data-column="gap-2">
					{#each cast.embeds as embed}
						{#if embed.url}
							<li>
								<Media media={{ url: embed.url }} alt="" />
							</li>
						{:else if embed.castId}
							{@const quotedAuthor = userByFid.get(embed.castId.fid)}
							<li>
								<a href="/farcaster/cast/{embed.castId.fid}/{embed.castId.hash}">
									Quote: @{quotedAuthor?.username ?? embed.castId.fid}
								</a>
							</li>
						{/if}
					{/each}
				</ul>
			{/if}
			{#if cast.likeCount != null || cast.recastCount != null}
				<dl data-definition-list="horizontal">
					{#if cast.likeCount != null && cast.likeCount > 0}
						<div>
							<dt>Likes</dt>
							<dd>{cast.likeCount}</dd>
						</div>
					{/if}
					{#if cast.recastCount != null && cast.recastCount > 0}
						<div>
							<dt>Recasts</dt>
							<dd>{cast.recastCount}</dd>
						</div>
					{/if}
				</dl>
			{/if}
		</div>
	</details>
{/if}
