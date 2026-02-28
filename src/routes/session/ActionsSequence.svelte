<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import type { Action } from '$/constants/actions.ts'
	import type { ItemState } from '$/lib/reorder/state.svelte.ts'
	import { ActionType, createAction } from '$/constants/actions.ts'
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
		connectedWallets = [],
		selectedActor = null,
		selectedChainId = null,
		isTestnet = false,
		sessionId = '',
		triggerSimulate = false,
		triggerExecute = false,
	}: {
		actions: Action[]
		operations?: ItemsListOperation[]
		connectedWallets?: ConnectedWallet[]
		selectedActor?: `0x${string}` | null
		selectedChainId?: number | null
		isTestnet?: boolean
		sessionId?: string
		triggerSimulate?: boolean
		triggerExecute?: boolean
	} = $props()


	// Components
	import ActionComponent from './Action.svelte'
	import EditableItemsList from '$/components/EditableItemsList.svelte'
</script>


{#snippet ReorderGhost(item: Action, _state: ItemState<Action>)}
	{@const index = actions.indexOf(item)}

	<div
		class="editable-item"
		data-row
	>
		<span
			class="drag-handle"
			aria-hidden="true"
		>
			⠿
		</span>
		<div
			class="editable-item-content"
			data-row-item="flexible"
		>
			{#if item != null}
				<ActionComponent
					bind:action={actions[index]}
					indexInSequence={index}
					{connectedWallets}
					{selectedActor}
					{selectedChainId}
					{isTestnet}
					{sessionId}
				/>
			{/if}
		</div>
	</div>
{/snippet}

<EditableItemsList
	bind:items={actions}
	{operations}
	createItem={() => createAction(ActionType.Swap)}
	reorderContent={ReorderGhost}
>
	{#snippet Item({ item, index })}
		{#if item != null}
			<ActionComponent
				bind:action={actions[index]}
				indexInSequence={index}
				{connectedWallets}
				{selectedActor}
				{selectedChainId}
				{isTestnet}
				{sessionId}
				triggerSimulate={index === 0 && triggerSimulate}
				triggerExecute={index === 0 && triggerExecute}
			/>
		{/if}
	{/snippet}
</EditableItemsList>
