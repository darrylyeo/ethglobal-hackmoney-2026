<script lang="ts">
	// Types/constants
	import type { EntityId, EntityType } from '$/data/$EntityType.ts'
	import {
		unwatchEntity,
		watchEntity,
		watchedEntitiesCollection,
		watchedEntityKey,
	} from '$/collections/WatchedEntities.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		entityType,
		entityId,
	}: {
		entityType: EntityType
		entityId: EntityId
	} = $props()


	// Context
	const watchedQuery = useLiveQuery((q) =>
		q.from({ row: watchedEntitiesCollection }).select(({ row }) => ({ row })),
	)


	// (Derived)
	const isManuallyWatched = $derived(
		(watchedQuery.data ?? []).some(
			(r) =>
				watchedEntityKey({
					entityType: r.row.entityType,
					entityId: r.row.entityId,
				}) === watchedEntityKey({ entityType, entityId }),
		),
	)


	// Actions
	const toggle = () =>
		isManuallyWatched
			? unwatchEntity(entityType, entityId)
			: watchEntity({ entityType, entityId })
</script>

<button
	type="button"
	aria-label={isManuallyWatched
		? 'Unwatch (remove from nav)'
		: 'Watch (pin to nav)'}
	title={isManuallyWatched
		? 'Unwatch'
		: 'Watch'}
	onclick={toggle}
>
	{isManuallyWatched
		? 'Unwatch'
		: 'Watch'}
</button>
