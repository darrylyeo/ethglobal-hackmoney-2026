<script lang="ts">
	// Types/constants
	import type { Theme } from '$/lib/theme.svelte'
	import { theme } from '$/lib/theme.svelte'
	import { DropdownMenu } from 'bits-ui'

	const options: { value: Theme; label: string; icon: string }[] = [
		{ value: 'light', label: 'Light', icon: '☀️' },
		{ value: 'dark', label: 'Dark', icon: '🌙' },
		{ value: 'system', label: 'System', icon: '💻' },
	]

	// (Derived)
	const currentIcon = $derived(
		theme.resolved === 'dark' ? '🌙' : '☀️'
	)
</script>


<DropdownMenu.Root>
	<DropdownMenu.Trigger data-theme-toggle aria-label="Toggle theme">
		<span aria-hidden="true">{currentIcon}</span>
	</DropdownMenu.Trigger>

	<DropdownMenu.Content data-theme-menu>
		{#each options as option (option.value)}
			<DropdownMenu.Item
				data-theme-option
				data-selected={theme.preference === option.value ? '' : undefined}
				onclick={() => theme.setTheme(option.value)}
			>
				<span aria-hidden="true">{option.icon}</span>
				<span>{option.label}</span>
				{#if theme.preference === option.value}
					<span aria-hidden="true">✓</span>
				{/if}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>


<style>
	:global([data-theme-toggle]) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5em;
		height: 2.5em;
		border-radius: 0.5em;
		background: var(--color-bg-subtle);
		border: 1px solid var(--color-border);
		cursor: pointer;
		font-size: 1em;
	}

	:global([data-theme-toggle]:hover) {
		background: var(--color-bg-card);
	}

	:global([data-theme-menu]) {
		min-width: 140px;
	}

	:global([data-theme-option]) {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 0.75em;
		cursor: pointer;
	}

	:global([data-theme-option]:hover) {
		background: var(--color-bg-subtle);
	}

	:global([data-theme-option][data-selected]) {
		font-weight: 600;
	}

	:global([data-theme-option] span:last-child) {
		margin-left: auto;
	}
</style>
