<script lang="ts" generics="_Item">
	// Types/constants
	import type { Snippet } from 'svelte'


	// IDs
	const _id = $props.id()


	// Props
	let {
		items,
		value = $bindable(),
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
		onInputBlur,
		onInputKeydown,
		Input,
		...rootProps
	}: {
		items: readonly _Item[]
		value?: _Item | undefined
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
		onInputBlur?: () => void
		onInputKeydown?: (e: KeyboardEvent) => void
		Input?: Snippet<[props: Record<string, unknown>]>
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
		getItemGroupId ?
			Array.from(
				items.reduce((m, item) => {
					const gid = getItemGroupId!(item)
					const arr = m.get(gid) ?? []
					arr.push(item)
					m.set(gid, arr)
					return m
				}, new Map<string, _Item[]>()),
			).map(([id, groupItems]) => ({
				id,
				label: getGroupLabel(id),
				items: groupItems.map((item) => ({
					item,
					id: getItemId(item),
					label: getItemLabel(item) ?? '',
					disabled: getItemDisabled ? getItemDisabled(item) : false,
				})),
			}))
		:
			[],
	)


	// Functions
	import { stringify } from 'devalue'


	// State
	let isFocused = $state(
		false
	)
	let open = $state(
		false
	)

	// (Derived)
	$effect(() => {
		if (isFocused) return
		const singleValue = value ?? undefined
		const nextValue = (
			normalizedItems.find((item) => item.id === (singleValue ? getItemId(singleValue) : ''))?.label ??
			(singleValue ? getItemLabel(singleValue) : '')
		)
		if (inputValue !== nextValue) inputValue = nextValue
	})
	const rootItems = $derived(
		normalizedItems.map((item) => ({
			value: item.id,
			label: item.label,
			disabled: item.disabled,
		})),
	)
	const filteredItems = $derived(
		inputValue === '' ?
			normalizedItems
		:
			normalizedItems.filter((item) => (
				item.label.toLowerCase().includes(inputValue.toLowerCase())
				),
			),
	)
	const filteredGroups = $derived(
		normalizedGroups.length > 0 ?
			normalizedGroups
				.map((group) => ({
					...group,
					items: group.items.filter((item) => (
						item.label.toLowerCase().includes(inputValue.toLowerCase())
						),
					),
				}))
				.filter((group) => group.items.length > 0)
		:
			[],
	)


	// Actions
	const onInput = (event: Event) => {
		const target = event.currentTarget
		if (!(target instanceof HTMLInputElement)) return
		inputValue = target.value
	}
	const setValue = (nextValue: string) => {
		const nextItem = normalizedItems.find((item) => item.id === nextValue)
		value = nextItem?.item ?? undefined
		inputValue = nextItem ? nextItem.label : ''
	}


	// Components
	import { Combobox } from 'bits-ui'

</script>


<Combobox.Root
	{...rootProps}
	type="single"
	bind:open
	bind:value={() => {
		const singleValue = value ?? undefined
		return singleValue ? getItemId(singleValue) : ''
	}, (nextValue) => setValue(nextValue)}
	{disabled}
	{name}
	items={rootItems}
	{inputValue}
>
	{#if children}
		{@render children()}
	{:else}
		<div
			data-combobox-single
			data-has-before={!!Before}
			data-row="gap-1"
		>
			{#if Before}
				{@render Before()}
			{/if}

			<Combobox.Input
				id={id ?? _id}
				aria-label={ariaLabel}
				{placeholder}
			>
				{#snippet child({ props })}
					{@const mergedProps = {
						...props,
						onfocus: () => {
							;(props.onfocus as (() => void) | undefined)?.()
							isFocused = true
							open = true
						},
						onblur: () => {
							;(props.onblur as (() => void) | undefined)?.()
							isFocused = false
							onInputBlur?.()
						},
						onkeydown: (e: KeyboardEvent) => {
							;(props.onkeydown as ((e: KeyboardEvent) => void) | undefined)?.(e)
							onInputKeydown?.(e)
						},
						oninput: (e: Event) => {
							onInput(e)
							typeof props.oninput === 'function' &&
								(props.oninput as (e: Event) => void)(e)
						},
					}}

					{#if Input}
						{@render Input(mergedProps)}
					{:else}
						<input {...mergedProps} />
					{/if}
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
											<span data-row="start gap-1">
												<span data-row-item="flexible">
													{#if Before}
														{@render Before()}
													{/if}

													{#if ItemSnippet}
														{@render ItemSnippet(item.item, selected)}
													{:else}
														{item.label}
													{/if}

													{#if After}
														{@render After()}
													{/if}
												</span>

												<span
													data-combobox-item-indicator
													data-selected={selected || undefined}
													aria-hidden="true"
												></span>
											</span>
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
									<span data-row="start gap-1">
										<span data-row-item="flexible">
											{#if Before}
												{@render Before()}
											{/if}

											{#if ItemSnippet}
												{@render ItemSnippet(item.item, selected)}
											{:else}
												{item.label}
											{/if}

											{#if After}
												{@render After()}
											{/if}
										</span>

										<span
											data-combobox-item-indicator
											data-selected={selected || undefined}
											aria-hidden="true"
										></span>
									</span>
								{/snippet}
							</Combobox.Item>
						{/each}
					{/if}
				</Combobox.Viewport>
			</Combobox.Content>
		</Combobox.Portal>
	{/if}
</Combobox.Root>
