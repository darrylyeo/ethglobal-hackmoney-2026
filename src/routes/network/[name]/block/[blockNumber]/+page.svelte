<script lang="ts">
	// Types/constants
	import type { NetworkConfig } from '$/constants/networks'
	import { getBlockUrl } from '$/constants/explorers'
	import { fetchBlock } from '$/collections/blocks'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { blocksCollection } from '$/collections/blocks'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'

	// Props
	let {
		data,
	}: {
		data: {
			nameParam: string
			blockNumberParam: string
			blockNumber: number
			chainId: number
			config: NetworkConfig
			slug: string
			caip2: string
		}
	} = $props()

	// State
	const blockQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: blocksCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.chainId, data.chainId),
						eq(row.$id.blockNumber, data.blockNumber),
					),
				)
				.select(({ row }) => ({ row })),
		[() => data.chainId, () => data.blockNumber],
	)
	const liveQueryEntries = $derived([
		{
			id: 'block',
			label: 'Block',
			query: blockQuery as { data: { row: unknown }[] | undefined },
		},
	])
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)

	// (Derived)
	const blockRow = $derived(blockQuery.data?.[0]?.row ?? null)
	const loading = $derived(blockRow?.isLoading ?? true)
	const blockError = $derived(blockRow?.error ?? null)

	// Actions
	$effect(() => {
		fetchBlock(data.chainId, data.blockNumber).catch(() => {})
	})

	const blockUrl = $derived(
		getBlockUrl(data.chainId, data.blockNumber),
	)
	const timestampLabel = $derived(
		blockRow?.timestamp
			? new Date(blockRow.timestamp).toISOString()
			: null,
	)
</script>

<svelte:head>
	<title>
		Block {data.blockNumberParam} · {data.config.name}
	</title>
</svelte:head>

<div data-column="gap-2" {@attach liveQueryAttachment}>
	<header class="block-header">
		<h1>Block</h1>
		<div class="block-identity" data-row="gap-2 align-center">
			<code class="block-number">{data.blockNumberParam}</code>
			<span class="network-name">{data.config.name}</span>
			<code class="caip2">{data.caip2}</code>
		</div>
	</header>

	{#if blockError}
		<p class="block-error" data-muted>{blockError}</p>
	{:else if loading && !blockRow?.timestamp}
		<p data-muted>Loading block…</p>
	{:else if blockRow}
		<dl class="block-details">
			<dt>Number</dt>
			<dd>{blockRow.number.toString()}</dd>
			{#if timestampLabel}
				<dt>Timestamp</dt>
				<dd>{timestampLabel}</dd>
			{/if}
		</dl>
		<a
			href={blockUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="action-link"
		>
			View on explorer
		</a>
	{/if}
</div>

<style>
	.block-header {
		display: grid;
		gap: 0.5rem;
	}

	.block-identity code {
		font-family: ui-monospace, monospace;
	}

	.block-identity code.caip2 {
		opacity: 0.8;
		font-size: 0.9em;
	}

	.network-name {
		font-weight: 500;
	}

	.block-error {
		margin: 0;
	}

	.block-details {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 1rem;
		margin: 0;
	}

	.block-details dt {
		opacity: 0.85;
	}

	.action-link {
		font-size: 0.9em;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-subtle);
		color: inherit;
		text-decoration: none;
		width: fit-content;
	}

	.action-link:hover {
		background: var(--color-border);
	}
</style>
