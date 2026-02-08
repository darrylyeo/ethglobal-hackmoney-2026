<script lang="ts">
	// Types/constants
	import type { Action } from '$/constants/actions.ts'
	import { createAction } from '$/constants/actions.ts'
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


<EditableItemsList
	bind:items={actions}
	{operations}
	createItem={() => createAction(ActionType.Swap)}
>
	{#snippet Item({ item, index })}
		<ActionComponent
			bind:action={actions[index]}
			actionIndex={index}
		/>
	{/snippet}
</EditableItemsList>
