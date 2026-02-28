<script lang="ts">
	// Types/constants
	import type { EvmTopic } from '$/data/EvmTopic.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'
	import {
		ensureEvmEventSignatures,
		evmTopicsCollection,
	} from '$/collections/EvmTopics.ts'
	import { getEvmTopicPath, parseEvmTopicHex } from '$/lib/signature-paths.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'

	// Context
	import { page } from '$app/state'

	// (Derived)
	const hexParam = $derived(
		page.params?.hex ?? ''
	)
	const parsed = $derived(
		parseEvmTopicHex(hexParam)
	)
	const href = $derived(
		parsed ? getEvmTopicPath(parsed) : '/evm/topics'
	)

	const entryQuery = useLiveQuery(
		(q) =>
			parsed
				? q
					.from({ row: evmTopicsCollection })
					.where(({ row }) => eq(row.$id.hex, parsed))
					.select(({ row }) => ({ row }))
				: q
					.from({ row: evmTopicsCollection })
					.where(({ row }) => eq(row.$id.hex, '0x' as `0x${string}`))
					.select(({ row }) => ({ row })),
		[() => parsed],
	)
	const entry = $derived(
		entryQuery.data?.[0]?.row as EvmTopic | undefined,
	)
	const label = $derived(
		entry?.signatures[0] ?? (parsed ?? '')
	)

	// Actions
	$effect(() => {
		if (!parsed) return
		void ensureEvmEventSignatures(parsed).catch(() => {})
	})

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import EvmTopic from '$/views/EvmTopic.svelte'
</script>


<svelte:head>
	<title>{parsed ?? 'Topic'} — EVM topics</title>
</svelte:head>

{#if !parsed}
	<main data-card>
		<Heading>Invalid topic</Heading>
		<p>Hex must be 32 bytes. <a href="/evm/topics">Back to EVM topics</a>.</p>
	</main>
{:else}
	<main data-card>
		<EntityView
			entityType={EntityType.EvmTopic}
			entity={entry}
			entityId={{ hex: parsed }}
			titleHref={href}
			{label}
			layout={EntityLayout.Page}
			metadata={[{ term: 'Hex', detail: parsed }]}
			annotation="topic"
		>
			{#snippet children()}
				{#if entry}
					<EvmTopic {entry} />
				{:else if entryQuery.isLoading}
					<p>Loading signatures…</p>
				{:else}
					<p>No signatures found for this topic.</p>
				{/if}
			{/snippet}
		</EntityView>
	</main>
{/if}
