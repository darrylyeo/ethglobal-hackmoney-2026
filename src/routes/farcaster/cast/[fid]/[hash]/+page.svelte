<script lang="ts">
	// Types/constants
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { FarcasterCast } from '$/data/FarcasterCast.ts'
	import {
		ensureCast,
		ensureCastAncestorChain,
		ensureRepliesForCast,
		farcasterCastsCollection,
	} from '$/collections/FarcasterCasts.ts'
	import {
		ensureFarcasterUser,
		farcasterUsersCollection,
	} from '$/collections/FarcasterUsers.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import {
		castAnchorId,
		getCastContextPath,
	} from '$/lib/farcaster-paths.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { goto } from '$app/navigation'
	import { page } from '$app/state'


	// (Derived)
	const fidParam = $derived(page.params.fid ?? '')
	const hashParam = $derived(page.params.hash ?? '')
	const fid = $derived(parseInt(fidParam, 10))
	const hash = $derived(
		hashParam?.startsWith('0x')
			? (hashParam as `0x${string}`)
			: (`0x${hashParam}` as `0x${string}`),
	)


	// Context
	const castQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: farcasterCastsCollection })
				.where(({ row }) =>
					and(eq(row.$id.fid, fid), eq(row.$id.hash, hash)),
				)
				.select(({ row }) => ({ row })),
		[() => [fid, hash]],
	)
	const allCastsQuery = useLiveQuery(
		(q) =>
			q.from({ row: farcasterCastsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const usersQuery = useLiveQuery(
		(q) =>
			q.from({ row: farcasterUsersCollection }).select(({ row }) => ({ row })),
		[],
	)


	// (Derived)
	const cast = $derived(castQuery.data?.[0]?.row as WithSource<FarcasterCast> | undefined)
	const allCasts = $derived(
		(allCastsQuery.data ?? []).map(({ row: cast }) => cast as WithSource<FarcasterCast>),
	)
	const replies = $derived(
		allCasts.filter((c) =>
			c.parentFid === fid
			&& c.parentHash === hash,
		),
	)


	// Functions
	const findInAll = (fid: number, h: `0x${string}`) =>
		allCasts.find((c) => c.$id.fid === fid && c.$id.hash === h)
	const getChildren = (node: WithSource<FarcasterCast>) =>
		allCasts.filter((c) =>
			c.parentFid === node.$id.fid
			&& c.parentHash === node.$id.hash,
		)
	const isOpen = (node: WithSource<FarcasterCast>) =>
		openNodes.has(`${node.$id.fid}:${node.$id.hash}`)


	// (Derived)
	const ancestorChain = $derived.by(() => {
		if (!cast?.parentFid || !cast?.parentHash) return []
		const chain: WithSource<FarcasterCast>[] = []
		let c: WithSource<FarcasterCast> | undefined = cast
		while (c?.parentFid != null && c?.parentHash) {
			const parent = findInAll(c.parentFid, c.parentHash)
			if (!parent) break
			chain.push(parent)
			c = parent
		}
		return chain
	})
	const rootCast = $derived(ancestorChain.at(-1) ?? cast ?? null)
	const isReply = $derived(ancestorChain.length > 0)
	const showContext = $derived(
		cast
			? getCastContextPath(cast)
			: null,
	)
	const userByFid = $derived(
		new Map(
			(usersQuery.data ?? []).map(({ row: user }) => [user.$id.fid, user]),
		),
	)


	// State
	import { SvelteSet } from 'svelte/reactivity'

	let isEnsureCastPending = $state(false)
	let isLoadingMoreReplies = $state(false)
	let openNodes = $state(new SvelteSet<string>())
	let repliesNextToken = $state<string | undefined>(undefined)


	// Actions
	const loadMoreReplies = () => {
		if (!repliesNextToken || isLoadingMoreReplies) return
		isLoadingMoreReplies = true
		ensureRepliesForCast(fid, hash, repliesNextToken)
			.then(({ nextPageToken }) => (repliesNextToken = nextPageToken))
			.catch(() => {})
			.finally(() => (isLoadingMoreReplies = false))
	}
	const onOpenChange = (node: WithSource<FarcasterCast>, open: boolean) => {
		if (open) {
			openNodes.add(`${node.$id.fid}:${node.$id.hash}`)
		} else {
			openNodes.delete(`${node.$id.fid}:${node.$id.hash}`)
		}
	}
	$effect(() => {
		if (fid > 0 && hash) {
			isEnsureCastPending = true
			ensureCast(fid, hash)
				.then((cast) => {
					if (cast.$id.hash !== hash)
						goto(`/farcaster/cast/${fid}/${cast.$id.hash}`, {
							replaceState: true,
						})
					else
						ensureRepliesForCast(fid, cast.$id.hash)
							.then(({ nextPageToken }) => (repliesNextToken = nextPageToken))
							.catch(() => {})
				})
				.catch(() => {})
				.finally(() => (isEnsureCastPending = false))
		} else {
			repliesNextToken = undefined
		}
	})
	$effect(() => {
		if (isReply && ancestorChain.length > 0)
			for (const a of ancestorChain)
				openNodes.add(`${a.$id.fid}:${a.$id.hash}`)
	})
	$effect(() => {
		if (cast) {
			ensureFarcasterUser(cast.$id.fid).catch(() => {})
			if (cast.parentFid != null && cast.parentHash)
				ensureCastAncestorChain(cast).catch(() => {})
		}
	})
	$effect(() => {
		if (rootCast && isReply)
			ensureRepliesForCast(rootCast.$id.fid, rootCast.$id.hash).catch(() => {})
	})
	$effect(() => {
		for (const e of cast?.embeds ?? []) {
			if (e.castId) {
				ensureCast(e.castId.fid, e.castId.hash).catch(() => {})
				ensureFarcasterUser(e.castId.fid).catch(() => {})
			}
		}
	})
	$effect(() => {
		for (const r of replies) {
			ensureFarcasterUser(r.$id.fid).catch(() => {})
		}
	})


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Media from '$/components/Media.svelte'
	import PaginationPlaceholder from '$/components/PaginationPlaceholder.svelte'
	import TreeNode from '$/components/TreeNode.svelte'
	import FarcasterCastView from '$/views/farcaster/FarcasterCast.svelte'
</script>

<svelte:head>
	<title>Cast · Farcaster</title>
</svelte:head>

<main data-column="gap-4">
	{#if cast}
		<EntityView
			entityType={EntityType.FarcasterCast}
			entity={cast}
			titleHref="/farcaster/cast/{cast.$id.fid}/{cast.$id.hash}"
			label={cast.text.length > 60 ? cast.text.slice(0, 60) + '…' : cast.text}
			metadata={[
				{
					term: 'Author',
					detail: `@${userByFid.get(cast.$id.fid)?.username ?? cast.$id.fid}`,
				},
				{ term: 'Time', detail: new Date(cast.timestamp).toLocaleString() },
				...(cast.likeCount != null || cast.recastCount != null
					? [
						{
							term: 'Engagement',
							detail: [
								...(cast.likeCount != null && cast.likeCount > 0
									? [`${cast.likeCount} like${cast.likeCount !== 1 ? 's' : ''}`]
									: []),
								...(cast.recastCount != null && cast.recastCount > 0
									? [`${cast.recastCount} recast${cast.recastCount !== 1 ? 's' : ''}`]
									: []),
							].join(', ') || '—',
						},
					]
					: []),
			]}
		>
			{#snippet children()}
				<div id={castAnchorId(cast.$id.fid, cast.$id.hash)} data-column="gap-4">
				{#if showContext}
					<p>
						<a href={showContext.href} data-link>Show Context</a>
					</p>
				{/if}
				{#if isReply && rootCast}
					<details open>
						<summary>In thread</summary>
						<div data-column>
							<span id={castAnchorId(rootCast.$id.fid, rootCast.$id.hash)}>
								<FarcasterCastView cast={rootCast} {userByFid} isCompact />
							</span>
							<TreeNode
								nodes={getChildren(rootCast)}
								getKey={(n) => `${n.$id.fid}:${n.$id.hash}`}
								{getChildren}
								{isOpen}
								{onOpenChange}
							>
								{#snippet Content({ node })}
									<span id={castAnchorId(node.$id.fid, node.$id.hash)}>
										<FarcasterCastView cast={node} {userByFid} isCompact />
									</span>
								{/snippet}
							</TreeNode>
						</div>
					</details>
				{/if}
				<p>{cast.text}</p>
				{#if cast.embeds?.length}
					<ul data-column>
						{#each cast.embeds as embed}
							{#if embed.url}
								<li>
									<Media media={{ url: embed.url }} alt="" />
								</li>
							{:else if embed.castId}
								{@const quotedCast = allCasts.find(
									(c) =>
										c.$id.fid === embed.castId!.fid &&
										c.$id.hash === embed.castId!.hash,
								)}
								<li>
									{#if quotedCast}
										<EntityView
											entityType={EntityType.FarcasterCast}
											entity={quotedCast}
											titleHref="/farcaster/cast/{quotedCast.$id.fid}/{quotedCast.$id.hash}"
											label={quotedCast.text.length > 60 ? quotedCast.text.slice(0, 60) + '…' : quotedCast.text}
											metadata={[
												{
													term: 'Author',
													detail: `@${userByFid.get(quotedCast.$id.fid)?.username ?? quotedCast.$id.fid}`,
												},
											]}
										>
											{#snippet children()}
												<FarcasterCastView cast={quotedCast} userByFid={userByFid} />
											{/snippet}
										</EntityView>
									{:else}
										<a href="/farcaster/cast/{embed.castId.fid}/{embed.castId.hash}">
											Quote: @{userByFid.get(embed.castId.fid)?.username ?? embed.castId.fid}
										</a>
									{/if}
								</li>
							{/if}
						{/each}
					</ul>
				{/if}
				{#if replies.length > 0}
					<details open>
						<summary>Replies ({replies.length})</summary>
						<TreeNode
							nodes={replies}
							getKey={(n) => `${n.$id.fid}:${n.$id.hash}`}
							getChildren={getChildren}
							isOpen={isOpen}
							onOpenChange={onOpenChange}
						>
							{#snippet Content({ node })}
								<span id={castAnchorId(node.$id.fid, node.$id.hash)}>
									<FarcasterCastView cast={node} userByFid={userByFid} isCompact />
								</span>
							{/snippet}
						</TreeNode>
						<PaginationPlaceholder
							hasMore={!!repliesNextToken}
							onLoadMore={loadMoreReplies}
							isLoading={isLoadingMoreReplies}
							label="Load more replies"
						/>
					</details>
				{/if}
				</div>
			{/snippet}
		</EntityView>
	{:else if castQuery.isLoading || isEnsureCastPending}
		<p>Loading cast…</p>
	{:else}
		<p>Cast not found</p>
	{/if}
</main>
