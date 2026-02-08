<script lang="ts">
	// Types/constants
	import type { ProtocolDefinition } from '$/constants/protocols.ts'


	// Props
	let {
		options,
		value = '',
		onSelect,
	}: {
		options: readonly ProtocolDefinition[]
		value?: string
		onSelect: (protocol: string | null) => void
	} = $props()
</script>

{#if options.length === 0}
	<p data-muted>No protocol for this action</p>
{:else if options.length === 1}
	<p data-muted>Using {options[0].label}</p>
{:else}
	<div data-column="gap-2">
		<div data-row="gap-2 align-center">
			<button
				type="button"
				data-card="radius-6 padding-3"
				data-selected={value === '' ? '' : undefined}
				onclick={() => onSelect(null)}
			>
				Auto
			</button>
			<span data-muted>or pick one:</span>
		</div>
		<div data-row="gap-2 wrap">
			{#each options as option (option.id)}
				<button
					type="button"
					class="protocol-card"
					data-card="radius-6 padding-3"
					data-selected={option.id === value ? '' : undefined}
					onclick={() => onSelect(option.id)}
				>
					<div data-row="gap-2 align-center justify-between">
						<strong>{option.label}</strong>
						{#if value === option.id}
							<span class="protocol-tag" data-tag data-variant="selected">Selected</span>
						{/if}
					</div>
					<div data-muted>{option.detail}</div>
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	.protocol-card {
		gap: 0.35em;
		border: 1px solid transparent;
		text-align: left;
		transition:
			border 0.2s ease,
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.protocol-card:hover {
		transform: translateY(-1px);
	}

	.protocol-card[data-selected] {
		border-color: var(--color-border-input);
		box-shadow: var(--shadow-lg);
	}

	.protocol-tag {
		font-size: 0.75em;
		padding: 0.15em 0.6em;
		background: var(--color-success-bg);
		color: var(--color-success);
	}

	.protocol-tag[data-variant='selected'] {
		background: var(--color-bg-subtle);
		color: var(--color-text-muted);
	}
</style>
