<script lang="ts">
	// Types/constants
	import type { ProtocolDefinition } from '$/constants/protocols.ts'

	// Components
	import Icon from '$/components/Icon.svelte'


	// Props
	let {
		options,
		value = '',
		activeProtocolId = null,
		onSelect,
	}: {
		options: readonly ProtocolDefinition[]
		value?: string
		activeProtocolId?: string | null
		onSelect: (protocol: string | null) => void
	} = $props()

	// (Derived)
	const rows = $derived(
		options.map((option) => ({ type: 'protocol' as const, option }))
	)
	const resolvedProtocol = $derived(
		value === ''
			? null
			: options.find((o) => o.id === value)
				? value
				: activeProtocolId
	)
</script>


{#if options.length === 0}
	<p data-text="muted">
		No protocol for this action
	</p>
{:else}
	<div data-column>
		{#each rows as row (row.option.id)}
			<div
				class="protocol-row"
				data-card="radius-6 padding-3"
				data-protocol={row.option.id}
				data-row="wrap"
				data-selected={
					row.option.id === value || (resolvedProtocol === row.option.id && value !== '')
						? ''
						: undefined
				}
			>
				<button
					type="button"
					class="protocol-row-main"
					data-row-item="flexible"
					data-row="start gap-3"
					onclick={() => onSelect(row.option.id)}
				>
					{#if row.option.icon.includes('/')}
						<Icon
							class="protocol-icon"
							src={row.option.icon}
							size={24}
							alt=""
						/>
					{:else}
						<Icon
							class="protocol-icon"
							icon={row.option.icon}
							size={24}
							alt=""
						/>
					{/if}

					<div data-column="gap-1">
						<strong>{row.option.label}</strong>
						<small data-text="muted">{row.option.detail}</small>
					</div>
				</button>
			</div>
		{/each}
	</div>
{/if}


<style>
	@import './protocol-fieldsets.css';
</style>
