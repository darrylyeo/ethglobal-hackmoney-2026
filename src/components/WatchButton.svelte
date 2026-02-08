<script lang="ts">
	// Types/constants
	import type { EntityType } from '$/data/$EntityType.ts'


	// Props
	let {
		entityType,
		id,
		label,
		href,
		autoWatched = false,
	}: {
		entityType: EntityType
		id: string
		label: string
		href: string
		autoWatched?: boolean
	} = $props()


	// State
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import {
		watchedEntitiesCollection,
		watchEntity,
		unwatchEntity,
	} from '$/collections/watched-entities.ts'


	// (Derived)
	const watchedQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: watchedEntitiesCollection })
				.where(({ row }) =>
					and(eq(row.entityType, entityType), eq(row.id, id)),
				)
				.select(({ row }) => ({ row })),
		[() => entityType, () => id],
	)
	const isManuallyWatched = $derived((watchedQuery.data ?? []).length > 0)


	// Actions
	const toggle = () =>
		isManuallyWatched
			? unwatchEntity(entityType, id)
			: watchEntity({ entityType, id, label, href })
</script>

{#if autoWatched}
	<span
		aria-label="Watching (automatic)"
		title="Watching"
	>Watching</span>
{:else}
	<button
		type="button"
		aria-label={isManuallyWatched ? 'Unwatch (remove from nav)' : 'Watch (pin to nav)'}
		title={isManuallyWatched ? 'Unwatch' : 'Watch'}
		onclick={toggle}
	>
		{isManuallyWatched ? 'Unwatch' : 'Watch'}
	</button>
{/if}
