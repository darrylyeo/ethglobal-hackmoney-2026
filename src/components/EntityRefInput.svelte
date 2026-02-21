<script lang="ts">
	// Types/constants
	import type { EntityRef } from '$/data/EntityRef.ts'
	import type { EntitySuggestion } from '$/lib/entitySuggestions.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { getEntitySuggestionsFromCache } from '$/lib/entitySuggestions.ts'
	import {
		buildDefaultEntityTriggerConfig,
		getValueFromSegmentsAndRefs,
		parseValueToSegmentsAndRefs,
	} from '$/lib/promptValue.ts'

	const DEFAULT_TRIGGER = '@'
	const PLACEHOLDER_REF: EntityRef = {
		entityType: EntityType.AgentChatTurn,
		entityId: '__placeholder__',
		displayLabel: DEFAULT_TRIGGER,
		trigger: DEFAULT_TRIGGER,
	}

	const entityTriggerParseConfig = buildDefaultEntityTriggerConfig()
	const triggerConfig = {
		[DEFAULT_TRIGGER]: {
			getSuggestions: getEntitySuggestionsFromCache,
		},
	} satisfies Record<string, { getSuggestions: (query: string) => EntitySuggestion[] }>
	const getPlaceholderRef = (trigger: string): EntityRef => ({ ...PLACEHOLDER_REF, trigger })


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


	// Functions
	const isPlaceholder = (r: EntityRef) => r.entityId === '__placeholder__'
	function serializeRef(ref: EntityRef): Record<string, string> {
		return {
			displayLabel: ref.displayLabel,
			entityId: ref.entityId,
			entityType: ref.entityType,
			...(ref.trigger != null && { trigger: ref.trigger }),
		}
	}

	function parseRef(el: HTMLElement): EntityRef | null {
		if (!el.hasAttribute('data-ref-chip')) return null
		const displayLabel = el.getAttribute('data-ref-display-label')
		const entityId = el.getAttribute('data-ref-entity-id')
		const entityType = el.getAttribute('data-ref-entity-type') as EntityRef['entityType'] | null
		if (displayLabel == null || entityId == null || entityType == null) return null
		const trigger = el.getAttribute('data-ref-trigger') ?? undefined
		return { entityType, entityId, displayLabel, ...(trigger && { trigger }) }
	}
	const getItemId = (s: EntitySuggestion) => `${s.ref.entityType}:${s.ref.entityId}`
	const getItemLabel = (s: EntitySuggestion) => s.label


	// State
	let textSegments = $state<string[]>([''])
	let refs = $state<EntityRef[]>([])


	// (Derived)
	const hasPlaceholder = $derived(refs.some(isPlaceholder))
	const resolvedRefs = $derived(refs.filter((r) => !isPlaceholder(r)))
	const computedPlaceholder = $derived(
		placeholder ?? 'Type a message… Use @ to reference entities',
	)


	// Actions
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
		const { segments, refs: parsed } = parseValueToSegmentsAndRefs(value, entityTriggerParseConfig)
		textSegments = segments
		refs = parsed
	})
	const handleSubmit = () => {
		if (hasPlaceholder) return
		const v = getValueFromSegmentsAndRefs(textSegments, refs)
		if (!v.trim()) return
		onsubmit?.(v, resolvedRefs)
	}


	// Components
	import RichTextarea from '$/components/RichTextarea.svelte'
</script>


<form
	data-entity-ref-input
	data-row="gap-2"
	onsubmit={(e) => (e.preventDefault(), handleSubmit())}
>
	<div data-row-item="flexible">
		<RichTextarea
			bind:segments={textSegments}
			bind:refs={refs}
			{isPlaceholder}
			{getPlaceholderRef}
			{triggerConfig}
			{getItemId}
			{getItemLabel}
			{serializeRef}
			{parseRef}
			placeholder={computedPlaceholder}
			{disabled}
			{autofocus}
		/>
	</div>

	<button type="submit" disabled={disabled || hasPlaceholder}>
		Send
	</button>
</form>
