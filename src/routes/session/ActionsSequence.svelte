<script lang="ts">
	// Types/constants
	import type { SessionAction } from '$/data/TransactionSession.ts'
	import { createSessionAction } from '$/data/TransactionSession.ts'
	import { ActionType } from '$/constants/intents.ts'
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
		actions: SessionAction[]
		operations?: ItemsListOperation[]
	} = $props()


	// Functions
	const createDefaultAction = (): SessionAction =>
		createSessionAction(ActionType.Swap)


	// Components
	import EditableItemsList from '$/components/EditableItemsList.svelte'
	import Action from './Action.svelte'
</script>


<EditableItemsList
	bind:items={actions}
	{operations}
	createItem={createDefaultAction}
>
	{#snippet Item({ item, index })}
		<Action bind:action={actions[index]} />
	{/snippet}
</EditableItemsList>
