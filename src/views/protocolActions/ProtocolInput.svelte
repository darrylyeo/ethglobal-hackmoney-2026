<script lang="ts">
	// Types/constants
	import { spandexQuoteStrategies } from '$/constants/spandex-quote-strategies.ts'
	import { labelByProtocolStrategy, type ProtocolDefinition, ProtocolStrategy } from '$/constants/protocols.ts'

	// Components
	import Icon from '$/components/Icon.svelte'
	import Select from '$/components/Select.svelte'


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
		onSelect: (protocolOrStrategy: string | null) => void
	} = $props()


	// (Derived)
	const strategyOptions = $derived(spandexQuoteStrategies)
	const strategyValue = $derived(
		strategyOptions.some((strategy) => strategy === value) ? value : '',
	)
	const rows = $derived(
		options.map((option) => ({ type: 'protocol' as const, option })),
	)
	const resolvedProtocol = $derived(
		value === ''
			? null
			: options.find((o) => o.id === value)
				? value
				: activeProtocolId,
	)
</script>

{#if options.length === 0}
	<p data-text="muted">No protocol for this action</p>
{:else}
	<div data-column="gap-2">
		<div class="protocol-row" data-card="radius-6 padding-3" data-row="gap-2 align-center">
			<span>Strategy</span>
			<Select
				items={strategyOptions}
				getItemId={(s: ProtocolStrategy) => s}
				getItemLabel={(s: ProtocolStrategy) => labelByProtocolStrategy[s] ?? s}
				bind:value={() => strategyValue, (v: string | string[]) => onSelect((typeof v === 'string' ? v : v?.[0] ?? '') || null)}
				placeholder="Select strategy"
				allowDeselect
				ariaLabel="Strategy"
			/>
		</div>
		{#each rows as row (row.option.id)}
				<div
					class="protocol-row"
					data-card="radius-6 padding-3"
					data-row="gap-2 wrap"
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
							<Icon class="protocol-icon" src={row.option.icon} size={24} alt="" />
						{:else}
							<Icon class="protocol-icon" icon={row.option.icon} size={24} alt="" />
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
	.protocol-row {
		gap: 0.35em;
		border: 1px solid transparent;
		text-align: left;
		transition: border 0.2s ease, box-shadow 0.2s ease;
	}

	.protocol-row[data-selected] {
		border-color: var(--color-border-input);
		box-shadow: var(--shadow-lg);
	}

	.protocol-row-main {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.protocol-row :global(.protocol-icon) {
		flex-shrink: 0;
	}

</style>
