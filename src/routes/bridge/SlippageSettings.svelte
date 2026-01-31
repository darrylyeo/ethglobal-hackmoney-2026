<script lang="ts">
	// Types/constants
	import { Button, Popover } from 'bits-ui'
	import {
		SLIPPAGE_PRESETS,
		DEFAULT_SLIPPAGE,
		formatSlippagePercent,
		parseSlippagePercent,
	} from '$/constants/slippage'

	// Props
	let {
		value = $bindable(DEFAULT_SLIPPAGE),
	}: {
		value?: number
	} = $props()

	// State
	let customInput = $state('')

	// (Derived)
	const isCustom = $derived(
		!SLIPPAGE_PRESETS.includes(value as (typeof SLIPPAGE_PRESETS)[number]),
	)

	// Actions
	const setPreset = (preset: (typeof SLIPPAGE_PRESETS)[number]) => {
		value = preset
		customInput = ''
	}

	const setCustom = () => {
		const parsed = parseSlippagePercent(customInput)
		if (parsed !== null) value = parsed
	}
</script>

<Popover.Root>
	<Popover.Trigger data-slippage-trigger>
		Slippage: {formatSlippagePercent(value)}
	</Popover.Trigger>
	<Popover.Content data-slippage-popover>
		<div data-slippage-presets>
			{#each SLIPPAGE_PRESETS as preset (preset)}
				<Button.Root
					type="button"
					onclick={() => setPreset(preset)}
					data-slippage-preset
					data-selected={value === preset ? '' : undefined}
				>
					{formatSlippagePercent(preset)}
				</Button.Root>
			{/each}
		</div>
		<div data-slippage-custom>
			<input
				type="text"
				inputmode="decimal"
				placeholder="Custom %"
				bind:value={customInput}
				onchange={setCustom}
			/>
		</div>
		{#if value > 0.01}
			<p data-slippage-warning>High slippage may result in unfavorable rates</p>
		{/if}
	</Popover.Content>
</Popover.Root>

<style>
	[data-slippage-trigger] {
		padding: 0.25em 0.5em;
		border-radius: 0.25em;
		border: 1px solid var(--color-border);
		background: var(--color-bg-subtle);
		cursor: pointer;
		font-size: 0.875em;
	}

	[data-slippage-popover] {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		min-width: 12em;
		padding: 0.75em;
	}

	[data-slippage-presets] {
		display: flex;
		gap: 0.5em;
	}

	[data-slippage-preset] {
		flex: 1;
		padding: 0.35em 0.5em;
		border-radius: 0.25em;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		cursor: pointer;
		font-size: 0.875em;
	}

	[data-slippage-preset][data-selected] {
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		border-color: var(--color-primary);
	}

	[data-slippage-custom] input {
		width: 100%;
		padding: 0.35em 0.5em;
		border-radius: 0.25em;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		font-size: 0.875em;
	}

	[data-slippage-warning] {
		color: var(--color-warning, #f59e0b);
		font-size: 0.875em;
		margin: 0;
	}
</style>
