<script lang="ts" generics="_Item">
	// Types/constants
	import type { Snippet } from 'svelte'
	import { stringify } from 'devalue'


	// IDs
	const _id = $props.id()


	// Props
	let {
		items,
		value = $bindable([] as _Item[]),
		getItemId = stringify,
		getItemLabel = getItemId,
		getItemDisabled,
		getItemGroupId,
		getGroupLabel = (groupId: string) => groupId,

		Before,
		After,
		Item: ItemSnippet,
		children,

		placeholder,
		disabled,
		name,
		id,
		ariaLabel,

		inputValue = $bindable(''),

		...rootProps
	}: {
		items: readonly _Item[]
		value?: _Item[]

		getItemId?: (item: _Item) => string
		getItemLabel?: (item: _Item) => string
		getItemDisabled?: (item: _Item) => boolean
		getItemGroupId?: (item: _Item) => string
		getGroupLabel?: (groupId: string) => string

		Before?: Snippet
		After?: Snippet
		Item?: Snippet<[item: _Item, selected: boolean]>
		children?: Snippet

		placeholder?: string
		disabled?: boolean
		name?: string
		id?: string
		ariaLabel?: string

		inputValue?: string

		[key: string]: unknown
	} = $props()


	// (Derived)
	const normalizedItems = $derived(
		items.map((item) => ({
			item,
			id: getItemId(item),
			label: getItemLabel(item) ?? '',
			disabled: getItemDisabled ? getItemDisabled(item) : false,
		})),
	)
	const normalizedGroups = $derived(
		getItemGroupId
			? Array.from(
					items.reduce((m, item) => {
						const gid = getItemGroupId!(item)
						const arr = m.get(gid) ?? []
						arr.push(item)
						m.set(gid, arr)
						return m
					}, new Map<string, _Item[]>()),
				)
					.map(([id, groupItems]) => ({
						id,
						label: getGroupLabel(id),
						items: groupItems.map((item) => ({
							item,
							id: getItemId(item),
							label: getItemLabel(item) ?? '',
							disabled: getItemDisabled ? getItemDisabled(item) : false,
						})),
					}))
			: [],
	)


	// State
	let isFocused = $state(false)
	let open = $state(false)


	// (Derived)
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
	const selectedChips = $derived(
		((value ?? []) as _Item[])
			.map((entry) => getItemId(entry))
			.map((id) => {
				const n = normalizedItems.find((item) => item.id === id)
				return n ? { id: n.id, label: n.label } : null
			})
			.filter(Boolean) as { id: string; label: string }[],
	)


	// Actions
	const onInput = (event: Event) => {
		const target = event.currentTarget
		if (!(target instanceof HTMLInputElement)) return
		inputValue = target.value
	}
	const removeChip = (chipId: string) => {
		value = ((value ?? []) as _Item[])
			.map((entry) => getItemId(entry))
			.filter((x) => x !== chipId)
			.flatMap((id) => {
				const item = normalizedItems.find((entry) => entry.id === id)
				return item ? [item.item] : []
			})
	}
	const setValue = (nextValue: string | string[]) => {
		const prevArr = ((value ?? []) as _Item[]).map((entry) => getItemId(entry))
		const nextArr = typeof nextValue === 'string' ? [] : nextValue
		value = nextArr.flatMap((id) => {
			const item = normalizedItems.find((entry) => entry.id === id)
			return item ? [item.item] : []
		})
		if (nextArr.length > prevArr.length) {
			queueMicrotask(() => (inputValue = ''))
		}
	}


	// Components
	import { Combobox } from 'bits-ui'
</script>


<Combobox.Root
	{...rootProps}
	type="multiple"
	bind:open
	bind:value={() => {
		return ((value ?? []) as _Item[]).map((entry) => getItemId(entry))
	}, (nextValue) => setValue(nextValue)}
	{disabled}
	{name}
	items={rootItems}
	{inputValue}
>
	{#if children}
		{@render children()}
	{:else}
		<div data-combobox-multi data-row="gap-1 wrap start">
			{#if Before}
				{@render Before()}
			{/if}
			{#each selectedChips as chip (chip.id)}
				<span data-badge="small" data-row="gap-1">
					{chip.label}
					<button
						type="button"
						aria-label="Remove {chip.label}"
						data-combobox-chip-remove
						onclick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							removeChip(chip.id)
						}}
					>
						×
					</button>
				</span>
			{/each}
			<Combobox.Input
				id={id ?? _id}
				data-combobox-multi-input
				aria-label={ariaLabel}
				{placeholder}
				onfocus={() => {
					isFocused = true
					open = true
				}}
				onblur={() => {
					isFocused = false
				}}
			>
				{#snippet child({ props })}
					{@const libOnInput = typeof props.oninput === 'function' ? props.oninput : undefined}
					<input
						{...props}
						oninput={(e) => {
							onInput(e)
							libOnInput?.(e)
						}}
					/>
				{/snippet}
			</Combobox.Input>
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
											<span
												data-combobox-item-indicator
												data-selected={selected || undefined}
												aria-hidden="true"
											></span>
											{#if ItemSnippet}
												{@render ItemSnippet(item.item, selected)}
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
									<span
										data-combobox-item-indicator
										data-selected={selected || undefined}
										aria-hidden="true"
									></span>
									{#if ItemSnippet}
										{@render ItemSnippet(item.item, selected)}
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
