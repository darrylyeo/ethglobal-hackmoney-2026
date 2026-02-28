<script lang="ts">
	// Types/constants
	import type { EntityRef } from '$/data/EntityRef.ts'
	import type { EntitySuggestion } from '$/lib/entitySuggestions.ts'


	// Components
	import Combobox from '$/components/Combobox.svelte'


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


	// Functions
	const getItemId = (s: EntitySuggestion) => `${s.ref.entityType}:${s.ref.entityId}`
	const getItemLabel = (s: EntitySuggestion) => s.label


	// State
	let selectedId = $state(
		''
	)

	// (Derived)
	$effect(() => {
		if (!selectedId) return
		const s = suggestions.find((x) => getItemId(x) === selectedId)
		if (s) onselect?.(s.ref)
		selectedId = ''
	})
</script>


<Combobox
	items={suggestions}
	getItemId={getItemId}
	getItemLabel={getItemLabel}
	bind:value={selectedId}
	{placeholder}
	ariaLabel="Entity reference"
/>
