<script lang="ts">


	// Types/constants
	import type { SessionAction } from '$/data/TransactionSession.ts'
	import type { SessionContext } from './session-context.ts'
	import {
		ActionType,
		actionTypes,
		type ActionTypeDefinition,
	} from '$/constants/intents.ts'


	// Context
	import { getContext } from 'svelte'
	import { SESSION_CONTEXT_KEY } from './session-context.ts'

	const sessionCtx = getContext<SessionContext>(SESSION_CONTEXT_KEY)


	// Props
	let {
		action = $bindable(),
	}: {
		action: SessionAction,
	} = $props()


	// (Derived)
	const actionTypeValue = $derived(
		String(action.type),
	)
	const activeSpec = $derived(
		actionTypes.find((s: ActionTypeDefinition) => s.type === action.type),
	)


	// Actions
	const onActionTypeChange = (value: string | string[] | null) => {
		if (typeof value !== 'string') return
		action = {
			...action,
			type: value as ActionType,
			params: {},
		}
	}


	// Components
	import Select from '$/components/Select.svelte'
	import BridgeAction from './BridgeAction.svelte'
	import SwapAction from './SwapAction.svelte'
	import TransferAction from './TransferAction.svelte'
	import LiquidityFlow from './LiquidityFlow.svelte'
</script>


<div
	data-session-action
	data-card
	data-column="gap-3"
>
	<header data-row="gap-2 align-center justify-between">
		<Select
			items={actionTypes}
			getItemId={(item: ActionTypeDefinition) => item.type}
			getItemLabel={(item: ActionTypeDefinition) => `${item.icon} ${item.label}`}
			bind:value={() => actionTypeValue, onActionTypeChange}
			placeholder="Select action"
			ariaLabel="Action type"
		/>
		{#if activeSpec}
			<span data-muted>{activeSpec.category}</span>
		{/if}
	</header>

	{#if action.type === ActionType.Swap}
		<SwapAction
			selectedWallets={sessionCtx.connectedWallets}
			selectedActor={sessionCtx.selectedActor}
		/>
	{:else if action.type === ActionType.Bridge}
		<BridgeAction
			selectedWallets={sessionCtx.connectedWallets}
			selectedActor={sessionCtx.selectedActor}
			globalIsTestnet={sessionCtx.isTestnet}
		/>
	{:else if action.type === ActionType.Transfer}
		{@const defaultAddress = sessionCtx.selectedActor ?? '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' as `0x${string}`}
		<TransferAction
			walletConnection={null}
			fromActor={defaultAddress}
			toActor={defaultAddress}
			chainId={sessionCtx.selectedChainId ?? 1}
			tokenAddress={'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`}
		/>
	{:else if action.type === ActionType.AddLiquidity || action.type === ActionType.RemoveLiquidity || action.type === ('liquidity' as typeof action.type)}
		<LiquidityFlow
			selectedWallets={sessionCtx.connectedWallets}
			selectedActor={sessionCtx.selectedActor}
			selectedChainId={sessionCtx.selectedChainId}
		/>
	{:else if activeSpec}
		<div data-grid="columns-autofit column-min-16 gap-6">
			<section data-card data-column="gap-3">
				<p data-muted>{activeSpec.label} action</p>
			</section>
			<section data-card data-column="gap-3">
				<p data-muted>Protocol</p>
			</section>
			<section data-card data-column="gap-3">
				<p data-muted>Preview</p>
			</section>
		</div>
	{/if}
</div>
