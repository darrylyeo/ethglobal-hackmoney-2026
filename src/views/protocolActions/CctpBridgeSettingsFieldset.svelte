<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'


	// Props
	let { action = $bindable() }: { action: Action } = $props()


	// (Derived)
	const p = $derived(
		action.type === ActionType.Bridge
			? (action.params as { transferSpeed: 'fast' | 'standard'; forwardingEnabled: boolean })
			: null,
	)
	const transferSpeedItems = $derived([
		{ id: 'fast' as const, label: 'Fast' },
		{ id: 'standard' as const, label: 'Standard' },
	])


	// Components
	import Select from '$/components/Select.svelte'
</script>

{#if action.type === ActionType.Bridge && p}
	<div data-card data-column="gap-2">
		<h3>CCTP settings</h3>
		<label data-column="gap-2">
			<span>Transfer speed</span>
			<Select
				items={transferSpeedItems}
				bind:value={() => transferSpeedItems.find((x) => x.id === p.transferSpeed) ?? undefined, (item) => {
					if (item && (item.id === 'fast' || item.id === 'standard'))
						action = { ...action, params: { ...action.params, transferSpeed: item.id } } as Action
				}}
				getItemId={(x) => x.id}
				getItemLabel={(x) => x.label}
				ariaLabel="Transfer speed"
			/>
		</label>
		<label data-row="gap-2 align-center">
			<input
				type="checkbox"
				checked={p.forwardingEnabled}
				onchange={(e) => {
					action = {
						...action,
						params: { ...action.params, forwardingEnabled: (e.currentTarget as HTMLInputElement).checked },
					} as Action
				}}
			/>
			Use Forwarding Service
		</label>
	</div>
{/if}
