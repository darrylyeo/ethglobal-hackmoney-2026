<script lang="ts">
	// Components
	import Hexadecimal from '$/components/Hexadecimal.svelte'

	// Props
	let {
		value = $bindable(''),
		placeholder = '0x',
		rows = 4,
		showPreview = true,
		bytesPerLine = 16,
		groupSize = 4,
		showOffset = true,
		showAscii = true,
		disabled,
		ariaLabel = 'Hexadecimal data',
		class: className,
	}: {
		value?: string
		placeholder?: string
		rows?: number
		showPreview?: boolean
		bytesPerLine?: number
		groupSize?: number
		showOffset?: boolean
		showAscii?: boolean
		disabled?: boolean
		ariaLabel?: string
		class?: string
	} = $props()

	// State
	let raw = $state(value)

	// (Derived)
	const normalized = $derived(
		raw
			.trim()
			.replace(/^0x/i, '')
			.replace(/\s/g, '')
			.replace(/[^0-9a-fA-F]/g, ''),
	)
	const hexEven = $derived(
		normalized.length % 2 === 0 ? normalized : normalized.slice(0, -1),
	)
	const valueOut = $derived(hexEven ? `0x${hexEven.toLowerCase()}` : '')

	// Actions
	function onInput(e: Event) {
		const t = e.currentTarget
		if (!(t instanceof HTMLTextAreaElement)) return
		const hexOnly = t.value.replace(/[^0-9a-fA-F]/g, '')
		raw = hexOnly
		value = valueOut
	}
	$effect(() => {
		const v = value ?? ''
		const pref = v.startsWith('0x') ? v.slice(2) : v
		if (pref !== raw.trim().replace(/^0x/i, '').replace(/\s/g, '')) raw = pref
	})
</script>

<div class="hex-input {className ?? ''}" data-input="hex">
	<textarea
		class="hex-input-field"
		{rows}
		{placeholder}
		{disabled}
		aria-label={ariaLabel}
		spellcheck="false"
		autocapitalize="off"
		value={raw}
		oninput={onInput}
	></textarea>
	{#if showPreview && valueOut}
		<Hexadecimal
			value={valueOut}
			{bytesPerLine}
			{groupSize}
			{showOffset}
			{showAscii}
			class="hex-input-preview"
		/>
	{/if}
</div>

<style>
	.hex-input {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.hex-input-field {
		font-family: var(--fontFamily-monospace);
		overflow-wrap: anywhere;
		width: 100%;
		box-sizing: border-box;
		resize: vertical;
		min-height: 4em;
	}
	.hex-input-preview {
		border: 1px solid var(--color-border, #ccc);
		border-radius: 0.25rem;
		padding: 0.5rem 0.75rem;
	}
</style>
