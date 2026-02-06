<script lang="ts" generics="Ref extends { displayLabel: string, trigger?: string }, Item extends { ref: Ref }">
	// Types/constants
	import { tick } from 'svelte'

	type TriggerConfig<Item> = Record<
		string,
		{ getSuggestions: (query: string) => Item[], pattern?: RegExp }
	>
	// Props
	let {
		segments = $bindable<string[]>(['']),
		refs = $bindable<Ref[]>([]),
		isPlaceholder,
		getPlaceholderRef,
		triggerConfig,
		getItemId,
		getItemLabel,
		serializeRef,
		parseRef,
		placeholder: placeholderText = 'Type a message…',
		disabled = false,
		autofocus = false,
	}: {
		segments?: string[]
		refs?: Ref[]
		isPlaceholder: (ref: Ref) => boolean
		getPlaceholderRef: (trigger: string) => Ref
		triggerConfig: TriggerConfig<Item>
		getItemId: (item: Item) => string
		getItemLabel: (item: Item) => string
		serializeRef: (ref: Ref) => Record<string, string>
		parseRef: (el: HTMLElement) => Ref | null
		placeholder?: string
		disabled?: boolean
		autofocus?: boolean
	} = $props()

	const defaultTrigger = $derived(
		(Object.keys(triggerConfig)[0] as string) ?? '@',
	)


	// State
	let editEl = $state<HTMLDivElement | null>(null)
	let placeholderFocused = $state(false)


	// Functions
	function parseContent(container: HTMLElement): { segments: string[], refs: Ref[] } {
		const outSegments: string[] = []
		const outRefs: Ref[] = []
		let currentText = ''
		for (const node of container.childNodes) {
			if (node.nodeType === Node.TEXT_NODE) {
				currentText += node.textContent ?? ''
				continue
			}
			if (node.nodeType !== Node.ELEMENT_NODE) continue
			const el = node as HTMLElement
			if (el.dataset.placeholder !== undefined) {
				outSegments.push(currentText)
				currentText = ''
				outRefs.push(getPlaceholderRef(el.dataset.trigger ?? defaultTrigger))
				continue
			}
			const ref = parseRef(el)
			if (ref) {
				outSegments.push(currentText)
				currentText = ''
				outRefs.push(ref)
			}
		}
		outSegments.push(currentText)
		return { segments: outSegments, refs: outRefs }
	}

	function getSegmentIndexAndOffset(container: HTMLElement): { segmentIndex: number, offset: number } | null {
		const sel = document.getSelection()
		if (!sel || sel.rangeCount === 0) return null
		const anchor = sel.anchorNode
		const anchorOffset = sel.anchorOffset
		if (!anchor) return null
		for (let i = 0; i < container.childNodes.length; i++) {
			const child = container.childNodes[i]
			const isInChild =
				child === anchor
				|| (child.nodeType === Node.ELEMENT_NODE && (child as Element).contains(anchor))
			if (!isInChild) continue
			if (child.nodeType === Node.TEXT_NODE)
				return { segmentIndex: i >> 1, offset: anchorOffset }
			return null
		}
		return null
	}

	function insertPlaceholderAtSelection(trigger: string) {
		if (!editEl) return
		const pos = getSegmentIndexAndOffset(editEl)
		if (pos === null) return
		const { segmentIndex, offset } = pos
		if (segmentIndex >= segments.length) return
		const seg = segments[segmentIndex]
		const before = seg.slice(0, offset)
		const after = seg.slice(offset)
		segments = [
			...segments.slice(0, segmentIndex),
			before,
			after,
			...segments.slice(segmentIndex + 1),
		]
		refs = [
			...refs.slice(0, segmentIndex),
			getPlaceholderRef(trigger),
			...refs.slice(segmentIndex),
		]
	}

	function setCaret(el: HTMLElement, segmentIndex: number, offset: number) {
		const textNode = el.childNodes[2 * segmentIndex]
		if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return
		const safeOffset = Math.min(offset, (textNode.textContent ?? '').length)
		const range = document.createRange()
		range.setStart(textNode, safeOffset)
		range.collapse(true)
		const sel = window.getSelection()
		sel?.removeAllRanges()
		sel?.addRange(range)
		el.focus()
	}

	function onSelect(ref: Ref) {
		const i = refs.findIndex((r) => isPlaceholder(r))
		if (i < 0) return
		placeholderFocused = false
		const triggerChar = refs[i].trigger ?? defaultTrigger
		refs = [
			...refs.slice(0, i),
			{ ...ref, trigger: triggerChar },
			...refs.slice(i + 1),
		]
		tick().then(() => {
			if (!editEl) return
			const nextNode = editEl.childNodes[2 * i + 2]
			if (!nextNode) return
			const range = document.createRange()
			range.setStart(nextNode, 0)
			range.collapse(true)
			const sel = window.getSelection()
			sel?.removeAllRanges()
			sel?.addRange(range)
			editEl.focus()
		})
	}

	function handleInput() {
		if (!editEl) return
		const pos = getSegmentIndexAndOffset(editEl)
		const { segments: nextSegments, refs: nextRefs } = parseContent(editEl)
		if (nextSegments.length !== nextRefs.length + 1) return
		segments = nextSegments
		refs = nextRefs
		if (pos) tick().then(() => setCaret(editEl!, pos.segmentIndex, pos.offset))
	}

	function focusPlaceholderInput(placement?: 'start' | 'end') {
		placeholderFocused = true
		tick().then(() => {
			const input = editEl?.querySelector<HTMLInputElement>('[data-placeholder] input')
			if (!input) return
			input.focus()
			const pos = placement === 'start' ? 0 : input.value.length
			input.setSelectionRange(pos, pos)
		})
	}

	export function focusEditableAt(segmentIndex: number, offset: number) {
		tick().then(() =>
			tick().then(() =>
				requestAnimationFrame(() => {
					if (editEl) setCaret(editEl, segmentIndex, offset)
				}),
			),
		)
	}

	function closeComboboxAndFocusEditable() {
		const i = refs.findIndex(isPlaceholder)
		if (i < 0) return
		placeholderFocused = false
		const offset = segments[i].length
		segments = [
			...segments.slice(0, i),
			segments[i] + segments[i + 1],
			...segments.slice(i + 2),
		]
		refs = refs.filter((_, idx) => idx !== i)
		focusEditableAt(i, offset)
	}

	function closeComboboxAndAppendAt() {
		const i = refs.findIndex(isPlaceholder)
		if (i < 0) return
		placeholderFocused = false
		const triggerChar = refs[i].trigger ?? defaultTrigger
		const offset = segments[i].length + triggerChar.length
		segments = [
			...segments.slice(0, i),
			segments[i] + triggerChar + segments[i + 1],
			...segments.slice(i + 2),
		]
		refs = refs.filter((_, idx) => idx !== i)
		focusEditableAt(i, offset)
	}

	function moveCaretFromCombobox(direction: 'left' | 'right') {
		const i = refs.findIndex(isPlaceholder)
		if (i < 0) return
		if (direction === 'left')
			focusEditableAt(i, segments[i].length)
		else
			focusEditableAt(i + 1, 0)
	}

	function handleKeydown(e: KeyboardEvent) {
		const trigger = e.key in triggerConfig ? (e.key as string) : null
		if (trigger) {
			insertPlaceholderAtSelection(trigger)
			e.preventDefault()
			focusPlaceholderInput('start')
			return
		}
		if (!editEl) return
		const pos = getSegmentIndexAndOffset(editEl)
		if (!pos) return
		const i = refs.findIndex(isPlaceholder)
		if (i < 0) return
		if (e.key === 'ArrowRight' && pos.segmentIndex === i && pos.offset === segments[i].length) {
			e.preventDefault()
			focusPlaceholderInput('start')
		} else if (e.key === 'ArrowLeft' && pos.segmentIndex === i + 1 && pos.offset === 0) {
			e.preventDefault()
			focusPlaceholderInput('end')
		} else if (e.key === 'Delete' && pos.segmentIndex === i && pos.offset === segments[i].length) {
			e.preventDefault()
			closeComboboxAndFocusEditable()
		}
	}

	$effect(() => {
		if (autofocus && editEl)
			editEl.focus()
	})


	// Components
	import RichTextareaReference from '$/components/RichTextareaReference.svelte'
</script>

<div
	bind:this={editEl}
	class="rich-textarea"
	data-testid="prompt-textbox"
	contenteditable={disabled ? 'false' : 'plaintext-only'}
	enterkeyhint="send"
	inputmode="text"
	data-placeholder={placeholderText}
	role="textbox"
	aria-label={placeholderText}
	tabindex="0"
	oninput={handleInput}
	onkeydown={handleKeydown}
>
	{#each segments as segment, i (i)}
		{segment}
		{#if i < refs.length}
			{@const ref = refs[i]}
			{@const triggerChar = ref.trigger ?? defaultTrigger}
			{@const getSuggestionsForRef = (q: string) => triggerConfig[triggerChar].getSuggestions(q)}
			{@const isFocused = isPlaceholder(ref) && placeholderFocused}
			<RichTextareaReference
				ref={ref}
				triggerCharacter={triggerChar}
				isEditable={isPlaceholder(ref)}
				{isFocused}
				getSuggestions={getSuggestionsForRef}
				{getItemId}
				{getItemLabel}
				onselect={onSelect}
				{serializeRef}
				onMoveCaret={moveCaretFromCombobox}
				onClose={closeComboboxAndFocusEditable}
				onCloseEmpty={closeComboboxAndAppendAt}
				onBlur={() => (placeholderFocused = false)}
			/>
		{/if}
	{/each}
</div>

<style>
	.rich-textarea {
		width: 100%;
		min-height: 2.5rem;
		padding: 0.375rem 0.75rem;
		box-sizing: border-box;
		white-space: pre-wrap;
		word-wrap: break-word;
		caret-color: currentColor;
	}

	.rich-textarea:empty:not(:focus)::before {
		content: attr(data-placeholder);
		color: var(--color-text-muted, #6b7280);
	}
</style>
