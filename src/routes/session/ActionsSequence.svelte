<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import type { Action } from '$/constants/actions.ts'
	import type { ItemState } from '$/lib/reorder/state.svelte.ts'
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
		connectedWallets = [],
		selectedActor = null,
		selectedChainId = null,
		isTestnet = false,
		sessionId = '',
	}: {
		actions: Action[]
		operations?: ItemsListOperation[]
		connectedWallets?: ConnectedWallet[]
		selectedActor?: `0x${string}` | null
		selectedChainId?: number | null
		isTestnet?: boolean
		sessionId?: string
	} = $props()


	// Components
	import EditableItemsList from '$/components/EditableItemsList.svelte'
	import ActionComponent from './Action.svelte'
</script>


{#snippet ReorderGhost(item: Action, _state: ItemState<Action>)}
	{@const index = actions.indexOf(item)}
	{@const indexInSequence = index}
	<div class="editable-item" data-row="gap-2">
		<span class="drag-handle" aria-hidden="true">⠿</span>
		<div class="editable-item-content" data-row-item="flexible">
			{#if item != null}
				<ActionComponent
					bind:action={actions[index]}
					{indexInSequence}
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
			/>
		{/if}
	{/snippet}
</EditableItemsList>
