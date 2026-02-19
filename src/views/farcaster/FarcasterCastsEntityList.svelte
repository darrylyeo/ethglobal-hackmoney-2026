<script lang="ts">
	// Types/constants
	import type { FarcasterCastRow } from '$/collections/FarcasterCasts.ts'
	import type { FarcasterUserRow } from '$/collections/FarcasterUsers.ts'
	import type { ItemsListPagination } from '$/components/ItemsList.types.ts'

	// Components
	import EntityList from '$/components/EntityList.svelte'
	import FarcasterCast from '$/views/farcaster/FarcasterCast.svelte'

	// Functions
	import { castAnchorId } from '$/lib/farcaster-paths.ts'

	// Props
	let {
		title,
		items,
		loaded,
		total,
		userByFid,
		placeholderKeys = new Set<string | [number, number]>(['loading']),
		placeholderText = 'Loading cast…',
		pagination,
	}: {
		title: string
		items: Set<FarcasterCastRow>
		loaded: number
		total?: number
		userByFid: Map<number, FarcasterUserRow>
		placeholderKeys?: Set<string | [number, number]>
		placeholderText?: string
		pagination?: ItemsListPagination
	} = $props()

	const getKey = (c: FarcasterCastRow) => `${c.$id.fid}:${c.$id.hash}`
</script>

<EntityList
	{title}
	{loaded}
	{total}
	{items}
	{getKey}
	getSortValue={(c) => -c.timestamp}
	{placeholderKeys}
	{pagination}
>
	{#snippet Item({ key, item, isPlaceholder })}
		{@const anchorId =
			typeof key === 'string' &&
			key !== 'loading'
				? (() => {
						const [fidStr, ...rest] = key.split(':')
						const hash = rest.join(':')
						const fid = parseInt(fidStr ?? '', 10)
						return !isNaN(fid) && hash.startsWith('0x')
							? castAnchorId(fid, hash as `0x${string}`)
							: undefined
					})()
				: undefined}
		<span id={anchorId}>
			{#if isPlaceholder}
				<code>{placeholderText}</code>
			{:else if item}
				<FarcasterCast cast={item} {userByFid} />
			{/if}
		</span>
	{/snippet}
</EntityList>
