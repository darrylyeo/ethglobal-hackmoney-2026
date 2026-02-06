<script lang="ts" generics="Item">
	// Types/constants
	import type { Snippet } from 'svelte'


	// Components
	import { Combobox } from 'bits-ui'

	const defaultItemLabel = (item: Item) => String(item)
	const isRecord = (value: unknown): value is Record<string, unknown> =>
		typeof value === 'object' && value !== null
	const isGroup = (
		value: unknown,
	): value is {
		id?: string
		label: string
		items: readonly Item[]
	} =>
		isRecord(value) &&
		typeof value.label === 'string' &&
		Array.isArray(value.items)
	const isGroupedItems = (
		value:
			| readonly Item[]
			| readonly { id?: string; label: string; items: readonly Item[] }[],
	): value is readonly {
		id?: string
		label: string
		items: readonly Item[]
	}[] => value.length > 0 && isGroup(value[0])


	// Props
	let {
		items,
		type = 'single',
		value = $bindable(type === 'multiple' ? [] : ''),
		placeholder,
		disabled,
		name,
		id,
		ariaLabel,
		getItemId = defaultItemLabel,
		getItemLabel = defaultItemLabel,
		getItemDisabled,
		Before,
		After,
		Item,
		children,
		inputValue = $bindable(''),
		...rootProps
	}: {
		items:
			| readonly Item[]
			| readonly { id?: string; label: string; items: readonly Item[] }[]
		value?: string | string[]
		type?: 'single' | 'multiple'
		placeholder?: string
		disabled?: boolean
		name?: string
		id?: string
		ariaLabel?: string
		getItemId?: (item: Item) => string
		getItemLabel?: (item: Item) => string
		getItemDisabled?: (item: Item) => boolean
		Before?: Snippet
		After?: Snippet
		Item?: Snippet<[item: Item, selected: boolean]>
		children?: Snippet
		inputValue?: string
		[key: string]: unknown
	} = $props()


	// State
	let isFocused = $state(false)
	let open = $state(false)


	// (Derived)
	const normalizedItems = $derived(
		(isGroupedItems(items) ? items.flatMap((group) => group.items) : items).map(
			(item) => ({
				item,
				id: getItemId(item),
				label: getItemLabel(item),
				disabled: getItemDisabled ? getItemDisabled(item) : false,
			}),
		),
	)
	const normalizedGroups = $derived(
		isGroupedItems(items)
			? items.map((group) => ({
					id: group.id ?? group.label,
					label: group.label,
					items: group.items.map((item) => ({
						item,
						id: getItemId(item),
						label: getItemLabel(item),
						disabled: getItemDisabled ? getItemDisabled(item) : false,
					})),
				}))
			: [],
	)
	const filteredItems = $derived(
		inputValue === ''
			? normalizedItems
			: normalizedItems.filter((item) =>
					item.label.toLowerCase().includes(inputValue.toLowerCase()),
				),
	)
	const filteredGroups = $derived(
		normalizedGroups.length > 0
			? normalizedGroups
					.map((group) => ({
						...group,
						items: group.items.filter((item) =>
							item.label.toLowerCase().includes(inputValue.toLowerCase()),
						),
					}))
					.filter((group) => group.items.length > 0)
			: [],
	)
	const rootItems = $derived(
		normalizedItems.map((item) => ({
			value: item.id,
			label: item.label,
			disabled: item.disabled,
		})),
	)

	$effect(() => {
		if (isFocused) return
		const nextValue =
			type === 'multiple'
				? Array.isArray(value)
					? normalizedItems
							.filter((item) => value.includes(item.id))
							.map((item) => item.label)
							.join(', ')
					: ''
				: typeof value === 'string'
					? (normalizedItems.find((item) => item.id === value)?.label ?? '')
					: ''
		if (inputValue !== nextValue) inputValue = nextValue
	})


	// Actions
	const onInput = (event: Event) => {
		const target = event.currentTarget
		if (!(target instanceof HTMLInputElement)) return
		inputValue = target.value
	}
	const setValue = (nextValue: string | string[]) => {
		value = nextValue
		if (typeof nextValue === 'string') {
			const nextItem = normalizedItems.find((item) => item.id === nextValue)
			if (nextItem) inputValue = nextItem.label
		}
	}
</script>

{#if type === 'multiple'}
	<Combobox.Root
		{...rootProps}
		type="multiple"
		bind:open
		bind:value={() => (Array.isArray(value) ? value : []), setValue}
		{disabled}
		{name}
		items={rootItems}
		{inputValue}
	>
		{#if children}
			{@render children()}
		{:else}
			<div data-row="gap-1 align-center">
				{#if Before}
					{@render Before()}
				{/if}
				<Combobox.Input
					{id}
					aria-label={ariaLabel}
					{placeholder}
					oninput={onInput}
					onfocus={() => {
						isFocused = true
						open = true
					}}
					onblur={() => {
						isFocused = false
					}}
				/>
				{#if After}
					<Combobox.Trigger aria-label={ariaLabel ?? 'Open'}>
						{@render After()}
					</Combobox.Trigger>
				{/if}
			</div>
			<Combobox.Portal>
				<Combobox.Content>
					<Combobox.Viewport>
						{#if filteredGroups.length > 0}
							{#each filteredGroups as group (group.id)}
								<Combobox.Group>
									<Combobox.GroupHeading>{group.label}</Combobox.GroupHeading>
									{#each group.items as item (item.id)}
										<Combobox.Item
											value={item.id}
											label={item.label}
											disabled={item.disabled}
										>
											{#snippet children({ selected })}
												{#if Before}
													{@render Before()}
												{/if}
												{#if Item}
													{@render Item(item.item, selected)}
												{:else}
													{item.label}
												{/if}
												{#if After}
													{@render After()}
												{/if}
											{/snippet}
										</Combobox.Item>
									{/each}
								</Combobox.Group>
							{/each}
						{:else}
							{#each filteredItems as item (item.id)}
								<Combobox.Item
									value={item.id}
									label={item.label}
									disabled={item.disabled}
								>
									{#snippet children({ selected })}
										{#if Before}
											{@render Before()}
										{/if}
										{#if Item}
											{@render Item(item.item, selected)}
										{:else}
											{item.label}
										{/if}
										{#if After}
											{@render After()}
										{/if}
									{/snippet}
								</Combobox.Item>
							{/each}
						{/if}
					</Combobox.Viewport>
				</Combobox.Content>
			</Combobox.Portal>
		{/if}
	</Combobox.Root>
{:else}
	<Combobox.Root
		{...rootProps}
		type="single"
		bind:open
		bind:value={() => (typeof value === 'string' ? value : ''), setValue}
		{disabled}
		{name}
		items={rootItems}
		{inputValue}
	>
		{#if children}
			{@render children()}
		{:else}
			<div data-row="gap-1 align-center">
				{#if Before}
					{@render Before()}
				{/if}
				<Combobox.Input
					{id}
					aria-label={ariaLabel}
					{placeholder}
					oninput={onInput}
					onfocus={() => {
						isFocused = true
						open = true
					}}
					onblur={() => {
						isFocused = false
					}}
				/>
				{#if After}
					<Combobox.Trigger aria-label={ariaLabel ?? 'Open'}>
						{@render After()}
					</Combobox.Trigger>
				{/if}
			</div>
			<Combobox.Portal>
				<Combobox.Content>
					<Combobox.Viewport>
						{#if filteredGroups.length > 0}
							{#each filteredGroups as group (group.id)}
								<Combobox.Group>
									<Combobox.GroupHeading>{group.label}</Combobox.GroupHeading>
									{#each group.items as item (item.id)}
										<Combobox.Item
											value={item.id}
											label={item.label}
											disabled={item.disabled}
										>
											{#snippet children({ selected })}
												{#if Before}
													{@render Before()}
												{/if}
												{#if Item}
													{@render Item(item.item, selected)}
												{:else}
													{item.label}
												{/if}
												{#if After}
													{@render After()}
												{/if}
											{/snippet}
										</Combobox.Item>
									{/each}
								</Combobox.Group>
							{/each}
						{:else}
							{#each filteredItems as item (item.id)}
								<Combobox.Item
									value={item.id}
									label={item.label}
									disabled={item.disabled}
								>
									{#snippet children({ selected })}
										{#if Before}
											{@render Before()}
										{/if}
										{#if Item}
											{@render Item(item.item, selected)}
										{:else}
											{item.label}
										{/if}
										{#if After}
											{@render After()}
										{/if}
									{/snippet}
								</Combobox.Item>
							{/each}
						{/if}
					</Combobox.Viewport>
				</Combobox.Content>
			</Combobox.Portal>
		{/if}
	</Combobox.Root>
{/if}
