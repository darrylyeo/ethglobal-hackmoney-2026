<script lang="ts">
	// Types/constants
	import type { EntityId, EntityType } from '$/data/$EntityType.ts'


	// Props
	let {
		entityType,
		entityId,
		autoWatched = false,
	}: {
		entityType: EntityType
		entityId: EntityId
		autoWatched?: boolean
	} = $props()


	// State
	import { useLiveQuery } from '@tanstack/svelte-db'
	import {
		watchedEntityKey,
		watchedEntitiesCollection,
		watchEntity,
		unwatchEntity,
	} from '$/collections/WatchedEntities.ts'


	// (Derived)
	const targetKey = $derived(watchedEntityKey({ entityType, entityId }))
	const watchedQuery = useLiveQuery((q) =>
		q.from({ row: watchedEntitiesCollection }).select(({ row }) => ({ row })),
	)
	const isManuallyWatched = $derived(
		(watchedQuery.data ?? []).some(
			(r) =>
				watchedEntityKey({
					entityType: r.row.entityType,
					entityId: r.row.entityId,
				}) === targetKey,
		),
	)


	// Actions
	const toggle = () =>
		isManuallyWatched
			? unwatchEntity(entityType, entityId)
			: watchEntity({ entityType, entityId })
</script>

{#if !autoWatched}
	<button
		type="button"
		aria-label={isManuallyWatched ? 'Unwatch (remove from nav)' : 'Watch (pin to nav)'}
		title={isManuallyWatched ? 'Unwatch' : 'Watch'}
		onclick={toggle}
	>
		{isManuallyWatched ? 'Unwatch' : 'Watch'}
	</button>
{/if}
