<script
	module
	lang="ts"
>
	export enum ItemsListOperation {
		Add = 'Add',
		Delete = 'Delete',
		Duplicate = 'Duplicate',
		Reorder = 'Reorder',
	}
</script>


<script lang="ts"
	generics="_Item"
>
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { ContentSnippet } from '$/lib/reorder/attachments.svelte.ts'
	import { createReorder } from '$/lib/reorder/attachments.svelte.ts'
	import type { ItemState } from '$/lib/reorder/state.svelte.ts'


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
		duplicateItem = (item: _Item) => structuredClone($state.snapshot(item) as _Item),
		Item,
		reorderContent,
	}: {
		items: _Item[]
		operations?: ItemsListOperation[]
		createItem: () => _Item
		duplicateItem?: (item: _Item) => _Item
		Item: Snippet<[{ item: _Item, index: number }]>
		reorderContent?: ContentSnippet<_Item>
	} = $props()

	// (Derived)
	const canDelete = $derived(
		operations.includes(ItemsListOperation.Delete)
	)
	const canDuplicate = $derived(
		operations.includes(ItemsListOperation.Duplicate)
	)
	const canReorder = $derived(
		operations.includes(ItemsListOperation.Reorder)
	)
	const manyItems = $derived(
		items.length > 200
	)


	// State
	const reorderContentRef = { current: undefined as ContentSnippet<_Item> | undefined }
	let reorder = $state<ReturnType<typeof createReorder<_Item>> | null>(null)


	// Actions
	$effect(() => {
		reorderContentRef.current = reorderContent
	})
	$effect(() => {
		if (canReorder && reorderContentRef.current) {
			if (!reorder) reorder = createReorder(() => reorderContentRef.current!)
		} else {
			reorder = null
		}
	})
	const addItem = () => {
		items = [...items, createItem()]
	}
	const deleteItem = (index: number) => {
		items = items.filter((_, i) => i !== index)
	}
	const duplicateItemAt = (index: number) => {
		items = [
			...items.slice(0, index + 1),
			duplicateItem(items[index]),
			...items.slice(index + 1),
		]
	}
	const onReorderDrop = () => {
		items = [...items]
	}


	// Components
	import { Button } from 'bits-ui'
</script>


{#snippet ItemActions(index: number)}
	{#if canDuplicate || canDelete}
		<div
			class="editable-item-actions"
			data-row="gap-1"
		>
			{#if canDuplicate}
				<Button.Root
					type="button"
					onclick={() => duplicateItemAt(index)}
					aria-label="Duplicate"
				>
					⧉
				</Button.Root>
			{/if}

			{#if canDelete}
				<Button.Root
					type="button"
					onclick={() => deleteItem(index)}
					aria-label="Delete"
				>
					✕
				</Button.Root>
			{/if}
		</div>
	{/if}
{/snippet}

{#if canReorder && reorder}
	<div
		class="editable-items-list"
		data-column
		class:many-items={manyItems}
		{@attach reorder.list({ getArray: () => items, onDrop: onReorderDrop })}
	>
		{#each items as value, i (value)}
			<div
				class="editable-item"
				data-row
				{@attach reorder.item(value, i)}
			>
				<span
					class="drag-handle"
					{@attach reorder.handle()}
					aria-hidden="true"
				>
					⠿
				</span>
				<div
					class="editable-item-content"
					data-row-item="flexible"
				>
					{@render Item({ item: value, index: i })}
				</div>

				{@render ItemActions(i)}
			</div>
		{/each}
	</div>
{:else}
	<div
		class="editable-items-list"
		data-column
		class:many-items={manyItems}
	>
		{#each items as item, index (index)}
			<div
				class="editable-item"
				data-row
			>
				<div
					class="editable-item-content"
					data-row-item="flexible"
				>
					{@render Item({ item, index })}
				</div>

				{@render ItemActions(index)}
			</div>
		{/each}
	</div>
{/if}

{#if operations.includes(ItemsListOperation.Add)}
	<div data-row="end">
		<Button.Root
			type="button"
			class="add-item-button"
			onclick={addItem}
		>+ Add</Button.Root>
	</div>
{/if}


<style>
	.editable-items-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.editable-item {
		align-items: start;
	}

	.editable-items-list.many-items > .editable-item {
		content-visibility: auto;
		contain-intrinsic-block-size: 0 60px;
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
