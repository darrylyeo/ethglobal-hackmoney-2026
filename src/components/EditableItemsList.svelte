<script module lang="ts">
	export enum ItemsListOperation {
		Add = 'Add',
		Delete = 'Delete',
		Duplicate = 'Duplicate',
		Reorder = 'Reorder',
	}
</script>


<script
	lang="ts"
	generics="_Item"
>


	// Types/constants
	import type { Snippet } from 'svelte'


	// Props
	let {
		items = $bindable([]),
		operations = [
			ItemsListOperation.Add,
			ItemsListOperation.Delete,
			ItemsListOperation.Duplicate,
			ItemsListOperation.Reorder,
		],
		createItem,
		duplicateItem = (item: _Item) => structuredClone(item),
		Item,
	}: {
		items: _Item[]
		operations?: ItemsListOperation[]
		createItem: () => _Item
		duplicateItem?: (item: _Item) => _Item
		Item: Snippet<[{ item: _Item, index: number }]>
	} = $props()


	// (Derived)
	const canAdd = $derived(
		operations.includes(ItemsListOperation.Add),
	)
	const canDelete = $derived(
		operations.includes(ItemsListOperation.Delete),
	)
	const canDuplicate = $derived(
		operations.includes(ItemsListOperation.Duplicate),
	)
	const canReorder = $derived(
		operations.includes(ItemsListOperation.Reorder),
	)


	// Actions
	const addItem = () => {
		items = [...items, createItem()]
	}

	const deleteItem = (index: number) => {
		items = items.filter((_, i) => i !== index)
	}

	const duplicateItemAt = (index: number) => {
		const clone = duplicateItem(items[index])
		items = [
			...items.slice(0, index + 1),
			clone,
			...items.slice(index + 1),
		]
	}

	const moveItem = (fromIndex: number, toIndex: number) => {
		if (fromIndex === toIndex) return
		const next = [...items]
		const [moved] = next.splice(fromIndex, 1)
		next.splice(toIndex, 0, moved)
		items = next
	}


	// State
	let draggingIndex = $state<number | null>(null)
	let dragOverIndex = $state<number | null>(null)

	const onDragStart = (index: number) => (e: DragEvent) => {
		draggingIndex = index
		e.dataTransfer!.effectAllowed = 'move'
	}

	const onDragOver = (index: number) => (e: DragEvent) => {
		e.preventDefault()
		dragOverIndex = index
	}

	const onDrop = (index: number) => (e: DragEvent) => {
		e.preventDefault()
		if (draggingIndex !== null && draggingIndex !== index) {
			moveItem(draggingIndex, index)
		}
		draggingIndex = null
		dragOverIndex = null
	}

	const onDragEnd = () => {
		draggingIndex = null
		dragOverIndex = null
	}


	// Components
	import { Button } from 'bits-ui'
</script>


<div class="editable-items-list" data-column="gap-2">
	{#each items as item, index (index)}
		<div
			class="editable-item"
			data-row="gap-2"
			data-dragging={draggingIndex === index ? '' : undefined}
			data-drag-over={dragOverIndex === index ? '' : undefined}
			draggable={canReorder ? 'true' : undefined}
			ondragstart={canReorder ? onDragStart(index) : undefined}
			ondragover={canReorder ? onDragOver(index) : undefined}
			ondrop={canReorder ? onDrop(index) : undefined}
			ondragend={canReorder ? onDragEnd : undefined}
			role="listitem"
		>
			{#if canReorder}
				<span class="drag-handle" aria-hidden="true">⠿</span>
			{/if}

			<div class="editable-item-content" data-row-item="flexible">
				{@render Item({ item, index })}
			</div>

			{#if canDuplicate || canDelete}
				<div class="editable-item-actions" data-row="gap-1">
					{#if canDuplicate}
						<Button.Root
							type="button"
							onclick={() => duplicateItemAt(index)}
							aria-label="Duplicate"
						>⧉</Button.Root>
					{/if}
					{#if canDelete}
						<Button.Root
							type="button"
							onclick={() => deleteItem(index)}
							aria-label="Delete"
						>✕</Button.Root>
					{/if}
				</div>
			{/if}
		</div>
	{/each}

	{#if canAdd}
		<Button.Root
			type="button"
			class="add-item-button"
			onclick={addItem}
		>+ Add</Button.Root>
	{/if}
</div>


<style>
	.editable-items-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.editable-item {
		align-items: start;
		transition: opacity 0.15s;

		&[data-dragging] {
			opacity: 0.4;
		}

		&[data-drag-over] {
			border-top: 2px solid var(--color-accent, currentColor);
		}
	}

	.drag-handle {
		cursor: grab;
		user-select: none;
		opacity: 0.4;
		padding: 0.25rem;

		&:active {
			cursor: grabbing;
		}
	}

	.editable-item-actions {
		flex-shrink: 0;
	}

	:global(.add-item-button) {
		align-self: start;
	}
</style>
