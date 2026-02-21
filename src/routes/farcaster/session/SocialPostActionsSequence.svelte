<script lang="ts">
	// Types/constants
	import type { SocialPostAction } from '$/constants/social-post-actions.ts'
	import { ItemsListOperation } from '$/components/EditableItemsList.svelte'
	import {
		createSocialPostAction,
		SocialPostActionType,
	} from '$/constants/social-post-actions.ts'


	// Props
	let {
		actions = $bindable([]),
		operations = [ItemsListOperation.Add, ItemsListOperation.Delete],
	}: {
		actions: SocialPostAction[]
		operations?: ItemsListOperation[]
	} = $props()


	// Components
	import EditableItemsList from '$/components/EditableItemsList.svelte'
	import SocialPostActionComponent from './SocialPostAction.svelte'
</script>

<EditableItemsList
	bind:items={actions}
	{operations}
	createItem={() => createSocialPostAction(SocialPostActionType.CreatePost)}
>
	{#snippet Item({ item, index })}
		{#if item != null}
			<SocialPostActionComponent bind:action={actions[index]} />
		{/if}
	{/snippet}
</EditableItemsList>
