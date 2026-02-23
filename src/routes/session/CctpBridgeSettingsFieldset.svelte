<script lang="ts">
	// Types/constants
	import { ActionType, TransferSpeed, type Action } from '$/constants/actions.ts'
	import { CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS } from '$/constants/cctp.ts'
	import { getCctpDomainId } from '$/lib/cctp.ts'


	// Props
	let { action = $bindable() }: { action: Action } = $props()


	// (Derived)
	const p = $derived(
		action.type === ActionType.Bridge
			? (action.params as {
					transferSpeed: TransferSpeed
					forwardingEnabled: boolean
					fromChainId: number | null
					toChainId: number | null
					isTestnet: boolean
				})
			: null,
	)
	const transferSpeedItems = $derived([
		{ id: TransferSpeed.Fast, label: 'Fast' },
		{ id: TransferSpeed.Standard, label: 'Standard' },
	])
	const fromDomain = $derived(p ? getCctpDomainId(p.fromChainId) : null)
	const toDomain = $derived(p ? getCctpDomainId(p.toChainId) : null)
	const apiHost = $derived(
		p?.isTestnet ? 'https://iris-api-sandbox.circle.com' : 'https://iris-api.circle.com',
	)
	const fastTransferSupported = $derived(
		p?.fromChainId != null && CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS.has(p.fromChainId),
	)


	// Components
	import CctpAllowance from '$/routes/bridge/cctp/CctpAllowance.svelte'
	import CctpFees from '$/routes/bridge/cctp/CctpFees.svelte'
	import Select from '$/components/Select.svelte'
</script>

{#if action.type === ActionType.Bridge && p}
	<div data-column>
		<div data-card data-column>
			<h3>CCTP settings</h3>
		<label data-column>
			<span>Transfer speed</span>
			<Select
				items={transferSpeedItems}
				bind:value={() => transferSpeedItems.find((x) => x.id === p.transferSpeed) ?? undefined, (item) => {
					if (item)
						action = { ...action, params: { ...action.params, transferSpeed: item.id } } as Action
				}}
				getItemId={(x) => x.id}
				getItemLabel={(x) => x.label}
				ariaLabel="Transfer speed"
			/>
		</label>
		<label data-row="align-center">
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
		<CctpFees {fromDomain} {toDomain} {apiHost} />
		<CctpAllowance {fastTransferSupported} {apiHost} />
	</div>
{/if}
