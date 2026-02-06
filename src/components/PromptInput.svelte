<script lang="ts">


	// Types/constants
	import type { EntityRef } from '$/data/EntityRef'
	import { EntityType } from '$/data/$EntityType'
	import { getEntitySuggestionsFromCache } from '$/lib/entity-suggestions'

	const PLACEHOLDER_REF: EntityRef = {
		entityType: EntityType.DialogueTurn,
		entityId: '__placeholder__',
		displayLabel: '@',
	}

	const isPlaceholder = (ref: EntityRef) => ref.entityId === '__placeholder__'


	// Props
	let {
		textSegments = $bindable(['']),
		entityRefs = $bindable<EntityRef[]>([]),
		placeholder,
		disabled = false,
		autofocus = false,
	}: {
		textSegments?: string[]
		entityRefs?: EntityRef[]
		placeholder?: string
		disabled?: boolean
		autofocus?: boolean
	} = $props()


	// State
	let editEl = $state<HTMLDivElement | null>(null)

	$effect(() => {
		if (autofocus && editEl)
			editEl.focus()
	})

	const cacheSuggestions = $derived(getEntitySuggestionsFromCache(''))


	// Functions
	function parseContent(container: HTMLElement): { segments: string[], refs: EntityRef[] } {
		const segments: string[] = []
		const refs: EntityRef[] = []
		let currentText = ''
		for (const node of container.childNodes) {
			if (node.nodeType === Node.TEXT_NODE) {
				currentText += node.textContent ?? ''
				continue
			}
			if (node.nodeType !== Node.ELEMENT_NODE) continue
			const el = node as HTMLElement
			if (el.dataset.placeholder !== undefined) {
				segments.push(currentText)
				currentText = ''
				refs.push(PLACEHOLDER_REF)
				continue
			}
			const id = el.dataset.entityId
			const type = el.dataset.entityType as EntityRef['entityType'] | undefined
			const label = el.dataset.displayLabel
			if (id !== undefined && type && label) {
				segments.push(currentText)
				currentText = ''
				refs.push({ entityType: type, entityId: id, displayLabel: label })
			}
		}
		segments.push(currentText)
		return { segments, refs }
	}

	function getSegmentIndexAndOffset(container: HTMLElement): { segmentIndex: number, offset: number } | null {
		const sel = document.getSelection()
		if (!sel || sel.rangeCount === 0) return null
		const anchor = sel.anchorNode
		const anchorOffset = sel.anchorOffset
		if (!anchor) return null
		let segmentIndex = 0
		for (const child of container.childNodes) {
			if (child.nodeType === Node.TEXT_NODE) {
				if (child === anchor)
					return { segmentIndex, offset: anchorOffset }
				segmentIndex++
				continue
			}
			if (child.nodeType === Node.ELEMENT_NODE)
				segmentIndex++
		}
		return null
	}

	function insertPlaceholderAtSelection() {
		if (!editEl) return
		const pos = getSegmentIndexAndOffset(editEl)
		if (pos === null) return
		const { segmentIndex, offset } = pos
		if (segmentIndex >= textSegments.length) return
		const seg = textSegments[segmentIndex]
		const before = seg.slice(0, offset)
		const after = seg.slice(offset)
		const newSegments = [
			...textSegments.slice(0, segmentIndex),
			before,
			after,
			...textSegments.slice(segmentIndex + 1),
		]
		const newRefs = [
			...entityRefs.slice(0, segmentIndex),
			PLACEHOLDER_REF,
			...entityRefs.slice(segmentIndex),
		]
		textSegments = newSegments
		entityRefs = newRefs
	}

	function onRefSelected(ref: EntityRef) {
		const i = entityRefs.findIndex((r) => isPlaceholder(r))
		if (i < 0) return
		entityRefs = [
			...entityRefs.slice(0, i),
			ref,
			...entityRefs.slice(i + 1),
		]
	}

	function handleInput() {
		if (!editEl) return
		const { segments, refs } = parseContent(editEl)
		if (segments.length !== refs.length + 1) return
		textSegments = segments
		entityRefs = refs
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === '@') {
			insertPlaceholderAtSelection()
			e.preventDefault()
		}
	}


	// Components
	import EntityReferenceInput from '$/components/EntityReferenceInput.svelte'
</script>


<div
	bind:this={editEl}
	class="prompt-input"
	contenteditable={disabled ? 'false' : 'plaintext-only'}
	enterkeyhint="send"
	inputmode="text"
	data-placeholder={placeholder ?? 'Type a message… Use @ to reference entities'}
	role="textbox"
	aria-label={placeholder}
	tabindex="0"
	oninput={handleInput}
	onkeydown={handleKeydown}
>
	{#each textSegments as segment, i (i)}
		{segment}
		{#if i < entityRefs.length}
			{#if isPlaceholder(entityRefs[i])}
				<span data-placeholder contenteditable="false">
					<EntityReferenceInput
						suggestions={cacheSuggestions}
						onselect={onRefSelected}
					/>
				</span>
			{:else}
				<span
					contenteditable="false"
					data-entity-ref
					data-entity-id={entityRefs[i].entityId}
					data-entity-type={entityRefs[i].entityType}
					data-display-label={entityRefs[i].displayLabel}
				>
					{entityRefs[i].displayLabel}
				</span>
			{/if}
		{/if}
	{/each}
</div>


<style>
	.prompt-input {
		width: 100%;
		min-height: 2.5rem;
		padding: 0.375rem 0.75rem;
		box-sizing: border-box;
		white-space: pre-wrap;
		word-wrap: break-word;
		caret-color: currentColor;
	}

	.prompt-input:empty:not(:focus)::before {
		content: attr(data-placeholder);
		color: var(--color-text-muted, #6b7280);
	}

	.prompt-input [data-entity-ref] {
		display: inline;
		padding: 0 0.125em;
		background: var(--color-bg-muted);
		border-radius: 0.25em;
	}

	.prompt-input [data-placeholder] {
		display: inline;
	}
</style>
