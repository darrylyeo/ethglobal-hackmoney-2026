<script lang="ts">
	// Types/constants
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { FarcasterCast } from '$/data/FarcasterCast.ts'
	import type { FarcasterUser } from '$/data/FarcasterUser.ts'
	import type { ItemsListPagination } from '$/components/ItemsList.types.ts'


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
		items: Set<WithSource<FarcasterCast>>
		loaded: number
		total?: number
		userByFid: Map<number, WithSource<FarcasterUser>>
		placeholderKeys?: Set<string | [number, number]>
		placeholderText?: string
		pagination?: ItemsListPagination
	} = $props()


	// Functions
	import { castAnchorId } from '$/lib/farcaster-paths.ts'

	const getKey = (c: WithSource<FarcasterCast>) => `${c.$id.fid}:${c.$id.hash}`


	// Components
	import ItemsListCollapsible from '$/components/ItemsListCollapsible.svelte'
	import FarcasterCast from '$/views/farcaster/FarcasterCast.svelte'
</script>

<ItemsListCollapsible
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
</ItemsListCollapsible>
