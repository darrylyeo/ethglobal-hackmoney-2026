<script lang="ts">
	// Types/constants
	import type { EntityRef } from '$/data/EntityRef'
	import type { EntitySuggestion } from '$/lib/entity-suggestions'


	// Props
	let {
		suggestions = [],
		placeholder = 'Type to search…',
		autofocus = false,
		onselect,
	}: {
		suggestions?: EntitySuggestion[]
		placeholder?: string
		autofocus?: boolean
		onselect?: (ref: EntityRef) => void
	} = $props()


	// State
	let selectedId = $state('')

	const getItemId = (s: EntitySuggestion) => `${s.ref.entityType}:${s.ref.entityId}`
	const getItemLabel = (s: EntitySuggestion) => s.label

	$effect(() => {
		if (!selectedId) return
		const s = suggestions.find((x) => getItemId(x) === selectedId)
		if (s) onselect?.(s.ref)
		selectedId = ''
	})


	// Components
	import Combobox from '$/components/Combobox.svelte'
</script>


<Combobox
	items={suggestions}
	getItemId={getItemId}
	getItemLabel={getItemLabel}
	bind:value={selectedId}
	{placeholder}
	ariaLabel="Entity reference"
/>
