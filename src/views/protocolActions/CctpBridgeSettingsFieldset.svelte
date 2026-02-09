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
</script>

{#if action.type === ActionType.Bridge && p}
	<div data-card data-column="gap-2">
		<h3>CCTP settings</h3>
		<div data-row="gap-2">
			<button
				type="button"
				data-selected={p.transferSpeed === 'fast' ? '' : undefined}
				onclick={() => {
					action = { ...action, params: { ...action.params, transferSpeed: 'fast' } } as Action
				}}
			>
				Fast
			</button>
			<button
				type="button"
				data-selected={p.transferSpeed === 'standard' ? '' : undefined}
				onclick={() => {
					action = { ...action, params: { ...action.params, transferSpeed: 'standard' } } as Action
				}}
			>
				Standard
			</button>
		</div>
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
