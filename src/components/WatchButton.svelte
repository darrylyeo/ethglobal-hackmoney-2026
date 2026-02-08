<script lang="ts">
	// Types/constants
	import type { EntityType } from '$/data/$EntityType.ts'


	// Props
	let {
		entityType,
		id,
		label,
		href,
	}: {
		entityType: EntityType
		id: string
		label: string
		href: string
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
	const isWatched = $derived((watchedQuery.data ?? []).length > 0)


	// Actions
	const toggle = () =>
		isWatched
			? unwatchEntity(entityType, id)
			: watchEntity({ entityType, id, label, href })
</script>

<button
	type="button"
	aria-label={isWatched ? 'Unwatch (remove from nav)' : 'Watch (pin to nav)'}
	title={isWatched ? 'Unwatch' : 'Watch'}
	onclick={toggle}
>
	{isWatched ? 'Unwatch' : 'Watch'}
</button>
