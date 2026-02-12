<script lang="ts">
	// Types/constants
	import type { Action } from '$/constants/actions.ts'
	import type { ItemState } from '$/lib/reorder/index.ts'
	import { createAction } from '$/lib/actions.ts'
	import { ActionType } from '$/constants/actions.ts'
	import { ItemsListOperation } from '$/components/EditableItemsList.svelte'


	// Props
	let {
		actions = $bindable([]),
		operations = [
			ItemsListOperation.Add,
			ItemsListOperation.Delete,
			ItemsListOperation.Duplicate,
			ItemsListOperation.Reorder,
		],
	}: {
		actions: Action[]
		operations?: ItemsListOperation[]
	} = $props()


	// Components
	import EditableItemsList from '$/components/EditableItemsList.svelte'
	import ActionComponent from './Action.svelte'
</script>


{#snippet reorderGhost(item: Action, _state: ItemState<Action>)}
	{@const index = actions.indexOf(item)}
	<div class="editable-item" data-row="gap-2">
		<span class="drag-handle" aria-hidden="true">⠿</span>
		<div class="editable-item-content" data-row-item="flexible">
			{#if item != null}
				<ActionComponent
					bind:action={actions[index]}
					actionIndex={index}
				/>
			{/if}
		</div>
	</div>
{/snippet}

<EditableItemsList
	bind:items={actions}
	{operations}
	createItem={() => createAction(ActionType.Swap)}
	reorderContent={reorderGhost}
>
	{#snippet Item({ item, index })}
		{#if item != null}
			<ActionComponent
				bind:action={actions[index]}
				actionIndex={index}
			/>
		{/if}
	{/snippet}
</EditableItemsList>
