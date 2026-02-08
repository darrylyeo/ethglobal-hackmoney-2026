<script module lang="ts">
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
	import type { Attachment } from 'svelte/attachments'
	import type { Snippet } from 'svelte'
	import type { AreaOptions } from '$/lib/reorder/area-state.svelte.ts'
	import type { ItemState } from '$/lib/reorder/item-state.svelte.ts'


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
	import { Reorder } from '$/lib/reorder/index.ts'
</script>


{#snippet itemActions(index: number)}
	{#if canDuplicate || canDelete}
		<div class="editable-item-actions" data-row="gap-1">
			{#if canDuplicate}
				<Button.Root type="button" onclick={() => duplicateItemAt(index)} aria-label="Duplicate">⧉</Button.Root>
			{/if}
			{#if canDelete}
				<Button.Root type="button" onclick={() => deleteItem(index)} aria-label="Delete">✕</Button.Root>
			{/if}
		</div>
	{/if}
{/snippet}

{#if canReorder}
	<Reorder>
		{#snippet content(item: _Item, state: ItemState<_Item>)}
			{@const index = items.indexOf(item)}
			<div class="editable-item" data-row="gap-2" use:state.anchor>
				<span class="drag-handle" use:state.handle aria-hidden="true">⠿</span>
				<div class="editable-item-content" data-row-item="flexible">
					{@render Item({ item, index })}
				</div>
				{@render itemActions(index)}
			</div>
		{/snippet}

		{#snippet children(
			attach: (options?: AreaOptions<_Item>) => Attachment<HTMLElement>,
			area: Snippet<[array: _Item[]]>,
		)}
			{@const areaAttachment = attach({ onDrop: onReorderDrop })}
			<div class="editable-items-list" data-column="gap-2" {@attach areaAttachment}>
				{@render area(items)}
			</div>
		{/snippet}
	</Reorder>
{:else}
	<div class="editable-items-list" data-column="gap-2">
		{#each items as item, index (index)}
			<div class="editable-item" data-row="gap-2">
				<div class="editable-item-content" data-row-item="flexible">
					{@render Item({ item, index })}
				</div>
				{@render itemActions(index)}
			</div>
		{/each}
	</div>
{/if}

{#if canAdd}
	<Button.Root
		type="button"
		class="add-item-button"
		onclick={addItem}
	>+ Add</Button.Root>
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
