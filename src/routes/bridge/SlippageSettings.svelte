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
		onValueChange,
	}: {
		value?: number
		onValueChange?: (v: number) => void
	} = $props()

	// State
	let customInput = $state('')

	// (Derived)
	const isCustom = $derived(
		!SLIPPAGE_PRESETS.includes(value as (typeof SLIPPAGE_PRESETS)[number]),
	)

	// Actions
	const setPreset = (preset: (typeof SLIPPAGE_PRESETS)[number]) => {
		if (onValueChange) onValueChange(preset)
		else value = preset
		customInput = ''
	}

	const setCustom = () => {
		const parsed = parseSlippagePercent(customInput)
		if (parsed !== null) {
			if (onValueChange) onValueChange(parsed)
			else value = parsed
		}
	}
</script>

<Popover.Root>
	<Popover.Trigger data-slippage-trigger>
		Slippage: {formatSlippagePercent(value)}
	</Popover.Trigger>
	<Popover.Content data-slippage-popover data-column="gap-3">
		<div data-row="gap-2">
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
		<div>
			<input
				type="text"
				inputmode="decimal"
				placeholder="Custom %"
				bind:value={customInput}
				onchange={setCustom}
			/>
		</div>
		{#if value > 0.01}
			<p data-muted>High slippage may result in unfavorable rates</p>
		{/if}
	</Popover.Content>
</Popover.Root>

<style>
	[data-slippage-preset] {
		flex: 1;
	}

	[data-slippage-preset][data-selected] {
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		border-color: var(--color-primary);
	}
</style>
