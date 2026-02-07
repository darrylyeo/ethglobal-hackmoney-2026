<script lang="ts">


	// Types/constants
	import {
		ActionType,
		actionTypeDefinitionByActionType,
	} from '$/constants/intents.ts'
	import { resolve } from '$app/paths'

	const navigableActionTypes = [
		ActionType.Swap,
		ActionType.Bridge,
		ActionType.Transfer,
		ActionType.CreateChannel,
		ActionType.CloseChannel,
		ActionType.AddLiquidity,
		ActionType.RemoveLiquidity,
		ActionType.CollectFees,
		ActionType.IncreaseLiquidity,
		ActionType.ShareAddress,
		ActionType.ProposeTransfer,
		ActionType.RequestVerification,
	] as const

	const navigableActions = navigableActionTypes.map(
		(actionType) => actionTypeDefinitionByActionType[actionType],
	)
</script>


<svelte:head>
	<title>Actions – USDC Tools</title>
</svelte:head>


<div data-column="center gap-4">
	<h1>Actions</h1>
	<p data-muted>Choose an action to start a session.</p>
	<nav
		aria-label="Session actions"
		data-grid="columns-autofit"
		class="route-cards"
	>
		{#each navigableActions as spec}
			<a
				href={resolve(`/session#/${spec.type}`)}
				data-card
				data-column="gap-1"
			>
				<span>{spec.label}</span>
			</a>
		{/each}
	</nav>
</div>


<style>
	.route-cards > a {
		text-decoration: none;
		color: inherit;
	}
</style>
