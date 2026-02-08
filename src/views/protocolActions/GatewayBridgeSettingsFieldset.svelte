<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'


	// Props
	let { action = $bindable() }: { action: Action } = $props()


	// (Derived)
	const p = $derived(
		action.type === ActionType.Bridge
			? (action.params as { useCustomRecipient: boolean; customRecipient: string })
			: null,
	)
</script>

{#if action.type === ActionType.Bridge && p}
	<div data-card data-column="gap-2">
		<h3 data-text="annotation">Gateway settings</h3>
		<p data-muted>Gateway uses the amount and networks above.</p>
		<label data-row="gap-2 align-center">
			<input
				type="checkbox"
				checked={p.useCustomRecipient}
				onchange={(e) => {
					action = {
						...action,
						params: { ...action.params, useCustomRecipient: (e.currentTarget as HTMLInputElement).checked },
					} as Action
				}}
			/>
			Use custom recipient
		</label>
		{#if p.useCustomRecipient}
			<label data-column="gap-0">
				<span>Recipient address</span>
				<input
					type="text"
					placeholder="0x…"
					value={p.customRecipient}
					oninput={(e) => {
						action = {
							...action,
							params: { ...action.params, customRecipient: (e.currentTarget as HTMLInputElement).value },
						} as Action
					}}
				/>
			</label>
		{/if}
	</div>
{/if}
