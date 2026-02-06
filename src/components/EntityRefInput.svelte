<script lang="ts">


	// Types/constants
	import type { EntityRef } from '$/data/EntityRef'
	import {
		getValueFromSegmentsAndRefs,
		parseValueToSegmentsAndRefs,
	} from '$/lib/prompt-value'


	// Props
	let {
		value = $bindable(''),
		entityRefs = $bindable<EntityRef[]>([]),
		placeholder,
		disabled = false,
		autofocus = false,
		onsubmit,
	}: {
		value?: string
		entityRefs?: EntityRef[]
		placeholder?: string
		disabled?: boolean
		autofocus?: boolean
		onsubmit?: (value: string, entityRefs: EntityRef[]) => void
	} = $props()


	// State
	let textSegments = $state<string[]>([''])
	let refs = $state<EntityRef[]>([])

	const isPlaceholder = (r: EntityRef) => r.entityId === '__placeholder__'
	const hasPlaceholder = $derived(refs.some(isPlaceholder))
	const resolvedRefs = $derived(refs.filter((r) => !isPlaceholder(r)))

	$effect(() => {
		entityRefs = resolvedRefs
	})

	$effect(() => {
		value = getValueFromSegmentsAndRefs(textSegments, refs)
	})

	$effect(() => {
		if (hasPlaceholder) return
		const current = getValueFromSegmentsAndRefs(textSegments, refs)
		if (value === current) return
		const { segments, refs: parsed } = parseValueToSegmentsAndRefs(value)
		textSegments = segments
		refs = parsed
	})

	const handleSubmit = () => {
		if (hasPlaceholder) return
		const v = getValueFromSegmentsAndRefs(textSegments, refs)
		if (!v.trim()) return
		onsubmit?.(v, resolvedRefs)
	}

	const computedPlaceholder = $derived(
		placeholder ?? 'Type a message… Use @ to reference entities',
	)


	// Components
	import PromptInput from '$/components/PromptInput.svelte'
</script>


<form
	data-row="gap-2"
	data-entity-ref-input
	onsubmit={(e) => {
		e.preventDefault()
		handleSubmit()
	}}
>
	<div data-row-item="flexible">
		<PromptInput
			bind:textSegments
			bind:entityRefs={refs}
			placeholder={computedPlaceholder}
			{disabled}
			{autofocus}
		/>
	</div>

	<button type="submit" {disabled}>
		Send
	</button>
</form>
