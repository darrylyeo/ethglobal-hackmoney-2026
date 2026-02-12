<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import { PatternType } from '$/constants/patterns.ts'


	// Props
	let { action = $bindable() }: { action: Action } = $props()


	// (Derived)
	const p = $derived(
		action.type === ActionType.Bridge
			? (action.params as { useCustomRecipient: boolean; customRecipient: string })
			: null,
	)


	// Components
	import PatternInput from '$/components/PatternInput.svelte'
</script>

{#if action.type === ActionType.Bridge && p}
	<div data-card data-column="gap-2">
		<h3>Gateway settings</h3>
		<p data-text="muted">Gateway uses the amount and networks above.</p>
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
			<label data-column="gap-2">
				<span>Recipient address</span>
				<PatternInput
					patternTypes={[PatternType.EvmAddress, PatternType.EnsName]}
					value={p.customRecipient}
					oninput={(e: Event) => {
						action = {
							...action,
							params: {
								...action.params,
								customRecipient: (e.currentTarget as HTMLInputElement).value,
							},
						} as Action
					}}
					ariaLabel="Recipient address"
				/>
			</label>
		{/if}
	</div>
{/if}
