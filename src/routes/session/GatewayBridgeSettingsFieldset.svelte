<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import type { Network$Id } from '$/data/Network.ts'


	// Props
	let {
		action = $bindable(),
		actors = [],
		network = 1,
	}: {
		action: Action
		actors?: readonly `0x${string}`[]
		network?: number
	} = $props()

	// (Derived)
	const p = $derived(
		action.type === ActionType.Bridge
			? (action.params as { useCustomRecipient: boolean; customRecipient: string; fromChainId?: number })
			: null,
	)
	const actorItems = $derived(
		actors.map((a) => ({ address: a }))
	)
	const effectiveNetwork = $derived(
		p?.fromChainId ?? network
	)


	// Components
	import AddressInput from '$/views/AddressInput.svelte'
</script>

{#if action.type === ActionType.Bridge && p}
	<div data-card data-column>
		<h3>Gateway settings</h3>
		<p data-text="muted">Gateway uses the amount and networks above.</p>
		<label data-row="align-center">
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
			<label data-column>
				<span>Recipient address</span>
				<AddressInput
					items={actorItems}
					bind:value={() => (p.customRecipient && p.customRecipient.startsWith('0x') ? (p.customRecipient as `0x${string}`) : null), (v) => {
						action = {
							...action,
							params: {
								...action.params,
								customRecipient: v ?? '',
							},
						} as Action
					}}
					network={effectiveNetwork as Network$Id}
					placeholder="Select or enter address"
					ariaLabel="Recipient address"
				/>
			</label>
		{/if}
	</div>
{/if}
