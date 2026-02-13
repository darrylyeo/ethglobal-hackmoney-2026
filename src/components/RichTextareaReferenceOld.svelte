<script
	lang="ts"
	generics="
		Ref extends { displayLabel: string, trigger?: string },
		Item extends { ref: Ref }
	"
>
	// Components
	import Combobox from '$/components/Combobox.svelte'


	// Props
	let {
		ref: refValue,
		triggerCharacter,
		isEditable,
		isFocused,
		getSuggestions,
		getItemId,
		getItemLabel,
		onselect,
		serializeRef,
		onMoveCaret,
		onClose,
		onCloseEmpty,
		onBlur,
	}: {
		ref: Ref
		triggerCharacter: string
		isEditable: boolean
		isFocused: boolean
		getSuggestions: (query: string) => Item[]
		getItemId: (item: Item) => string
		getItemLabel: (item: Item) => string
		onselect: (ref: Ref) => void
		serializeRef: (ref: Ref) => Record<string, string>
		onMoveCaret?: (dir: 'left' | 'right') => void
		onClose?: () => void
		onCloseEmpty?: () => void
		onBlur?: () => void
	} = $props()


	// State
	let filterValue = $state('')
	let selectedId = $state('')


	// (Derived)
	const items = $derived(getSuggestions(filterValue))

	$effect(() => {
		const id = selectedId
		if (!id) return
		const item = items.find((x) => getItemId(x) === id)
		if (item) onselect(item.ref)
		selectedId = ''
	})


	// Functions
	const camelToKebab = (s: string) =>
		s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault()
			onMoveCaret?.('left')
		} else if (e.key === 'ArrowRight') {
			e.preventDefault()
			onMoveCaret?.('right')
		} else if ((e.key === 'Delete' || e.key === 'Backspace') && filterValue === '') {
			e.preventDefault()
			onCloseEmpty?.()
		}
	}

	function handleFocusout(container: HTMLElement, e: FocusEvent) {
		if (!container.contains(e.relatedTarget as Node)) onBlur?.()
	}
</script>

<span data-ref>
	{#if isEditable && isFocused}
		<div
			data-placeholder
			data-trigger={triggerCharacter}
			role="presentation"
			{@attach (el) => {
				const blur = (e: FocusEvent) => handleFocusout(el, e)
				el.addEventListener('keydown', handleKeydown, true)
				el.addEventListener('focusout', blur, true)
				return () => {
					el.removeEventListener('keydown', handleKeydown, true)
					el.removeEventListener('focusout', blur, true)
				}
			}}
		>
			<Combobox
				items={items}
				bind:value={selectedId}
				bind:inputValue={filterValue}
				{getItemId}
				{getItemLabel}
				placeholder=""
				ariaLabel="Entity reference"
			/>
		</div>
	{:else if isEditable}
		<span data-placeholder data-trigger={triggerCharacter}>{triggerCharacter}</span>
	{:else}
		<span
			contenteditable="false"
			data-ref-chip
			{...(Object.fromEntries(
				Object.entries(serializeRef(refValue)).map(([k, v]) => [
					`data-ref-${camelToKebab(k)}`,
					v,
				]),
			) as Record<string, string>)}
		>
			{refValue.displayLabel}
		</span>
	{/if}
</span>

<style>
	[data-ref] {
		[data-placeholder] {
			display: inline;
		}

		[data-placeholder]::before {
			content: attr(data-trigger);
		}

		[data-placeholder] :global(input) {
			field-sizing: content;
		}

		[data-ref-chip] {
			display: inline;
			padding: 0 0.125em;
			background: var(--color-bg-muted);
			border-radius: 0.25em;
		}
	}
</style>
