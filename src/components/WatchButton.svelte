<script lang="ts">
	// Types/constants
	import type { EntityId, EntityType } from '$/data/$EntityType.ts'
	import {
		unwatchEntity,
		watchEntity,
		watchedEntitiesCollection,
	} from '$/collections/WatchedEntities.ts'
	import { entityKey } from '$/lib/entity-key.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		entityType,
		entity,
		entityId,
	}: {
		entityType: EntityType
		entity?: { $id: EntityId }
		entityId?: EntityId
	} = $props()

	const effectiveEntityId = $derived(
		entity?.$id ?? entityId
	)

	// Context
	const watchedQuery = useLiveQuery((q) => (
		q.from({ row: watchedEntitiesCollection }).select(({ row }) => ({ row }))
	),
	)

	// (Derived)
	const isManuallyWatched = $derived(
		effectiveEntityId != null
		&& (watchedQuery.data ?? []).some(
			(r) => (
				entityKey({
					entityType: r.row.entityType,
					entityId: r.row.entityId,
				}) === entityKey({ entityType, entityId: effectiveEntityId })
			),
		)
	)


	// Actions
	const toggle = () => {
		if (effectiveEntityId == null) return
		isManuallyWatched
			? unwatchEntity(entityType, effectiveEntityId)
			: watchEntity({ entityType, entityId: effectiveEntityId })
	}
</script>

{#if effectiveEntityId != null}
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
{/if}
