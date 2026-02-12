<script lang="ts">
	// Types/constants
	import { ProtocolTag, protocolTagById, type ProtocolDefinition } from '$/constants/protocols.ts'

	// Components
	import Icon from '$/components/Icon.svelte'


	// Props
	let {
		options,
		value = '',
		onSelect,
	}: {
		options: readonly ProtocolDefinition[]
		value?: string
		onSelect: (protocolOrTag: string | null) => void
	} = $props()


	// (Derived)
	const rows = $derived([
		{ type: 'auto' as const },
		...options.map((option) => ({ type: 'protocol' as const, option })),
	])
	const resolvedProtocol = $derived(
		value === ''
			? null
			: options.find((o) => o.id === value)
				? value
				: options.find((o) => o.tags?.includes(value as ProtocolTag))?.id ?? null,
	)
</script>

{#if options.length === 0}
	<p data-text="muted">No protocol for this action</p>
{:else if options.length === 1}
	<p data-text="muted">Using {options[0].label}</p>
{:else}
	<div data-column="gap-2">
		{#each rows as row (row.type === 'auto' ? 'auto' : row.option.id)}
			{#if row.type === 'auto'}
				<button
					type="button"
					class="protocol-row"
					data-card="radius-6 padding-3"
					data-selected={value === '' ? '' : undefined}
					onclick={() => onSelect(null)}
				>
					Auto
				</button>
			{:else}
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
							<Icon class="protocol-icon" src={row.option.icon} />
						{:else}
							<Icon class="protocol-icon" icon={row.option.icon} />
						{/if}
						<div data-column="gap-1">
							<strong>{row.option.label}</strong>
							<small data-text="muted">{row.option.detail}</small>
						</div>
					</button>
					{#each row.option.tags ?? [] as tagId (tagId)}
						<button
							type="button"
							class="protocol-tag"
							data-tag
							onclick={() => onSelect(tagId)}
						>
							{protocolTagById[tagId]?.label}
						</button>
					{/each}
				</div>
			{/if}
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

	.protocol-tag {
		font-size: 0.75em;
		padding: 0.15em 0.6em;
		background: var(--color-success-bg);
		color: var(--color-success);
		cursor: pointer;
	}
</style>
