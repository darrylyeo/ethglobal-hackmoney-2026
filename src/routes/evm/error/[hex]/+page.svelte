<script lang="ts">
	// Types/constants
	import type { EvmError } from '$/data/EvmError.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'
	import {
		ensureEvmErrorSignatures,
		evmErrorsCollection,
	} from '$/collections/EvmErrors.ts'
	import { getEvmErrorPath, parseEvmErrorHex } from '$/lib/signature-paths.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'

	// Context
	import { page } from '$app/state'

	// (Derived)
	const hexParam = $derived(page.params?.hex ?? '')
	const parsed = $derived(parseEvmErrorHex(hexParam))
	const href = $derived(parsed ? getEvmErrorPath(parsed) : '/evm/errors')

	const entryQuery = useLiveQuery(
		(q) =>
			parsed
				? q
					.from({ row: evmErrorsCollection })
					.where(({ row }) => eq(row.$id.hex, parsed))
					.select(({ row }) => ({ row }))
				: q
					.from({ row: evmErrorsCollection })
					.where(({ row }) => eq(row.$id.hex, '0x' as `0x${string}`))
					.select(({ row }) => ({ row })),
		[() => parsed],
	)
	const entry = $derived(
		entryQuery.data?.[0]?.row as EvmError | undefined,
	)
	const label = $derived(entry?.signatures[0] ?? (parsed ?? ''))

	// Actions
	$effect(() => {
		if (!parsed) return
		void ensureEvmErrorSignatures(parsed).catch(() => {})
	})

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import EvmError from '$/views/EvmError.svelte'
</script>

<svelte:head>
	<title>{parsed ?? 'Error'} — EVM errors</title>
</svelte:head>

{#if !parsed}
	<main data-card>
		<Heading>Invalid error selector</Heading>
		<p>Hex must be 4 bytes. <a href="/evm/errors">Back to EVM errors</a>.</p>
	</main>
{:else}
	<main data-card>
		<EntityView
			entityType={EntityType.EvmError}
			entity={entry}
			entityId={{ hex: parsed }}
			titleHref={href}
			{label}
			layout={EntityLayout.Page}
			metadata={[{ term: 'Hex', detail: parsed }]}
			annotation="error"
		>
			{#snippet children()}
				{#if entry}
					<EvmError {entry} />
				{:else if entryQuery.isLoading}
					<p>Loading signatures…</p>
				{:else}
					<p>No signatures found for this error selector.</p>
				{/if}
			{/snippet}
		</EntityView>
	</main>
{/if}
