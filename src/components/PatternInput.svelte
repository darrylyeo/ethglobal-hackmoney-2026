<script lang="ts">
	// Types/constants
	import type { PatternType } from '$/constants/patterns.ts'
	import { patternsByType } from '$/constants/patterns.ts'


	// Props
	let {
		patternTypes,
		value = $bindable(''),
		placeholder,
		disabled,
		name,
		id,
		ariaLabel,
		...rootProps
	}: {
		patternTypes: readonly PatternType[]
		value?: string
		placeholder?: string
		disabled?: boolean
		name?: string
		id?: string
		ariaLabel?: string
		[key: string]: unknown
	} = $props()

	// (Derived)
	const computedPlaceholder = $derived(
		placeholder ??
			(patternTypes.length === 0
				? ''
				: patternTypes.length === 1
					? patternsByType[patternTypes[0]].placeholder
					: patternTypes
							.map((t) => patternsByType[t].placeholder)
							.join(' or '))
	)
	const isControlled = $derived(
		'value' in rootProps && rootProps.value !== undefined
	)
	const inputValue = $derived(
		isControlled ? (rootProps.value as string) : value
	)


	// Actions
	const oninput = (e: Event) => {
		const target = e.currentTarget
		if (!(target instanceof HTMLInputElement)) return
		if (!isControlled) value = target.value
		;(rootProps.oninput as ((e: Event) => void) | undefined)?.(e)
	}
</script>


<input
	type="text"
	{...rootProps}
	value={inputValue}
	{oninput}
	placeholder={computedPlaceholder}
	{disabled}
	{name}
	{id}
	aria-label={ariaLabel}
/>
