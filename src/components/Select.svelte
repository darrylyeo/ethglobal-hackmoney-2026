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
		allowDeselect,
		id,
		ariaLabel,
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
		allowDeselect?: boolean
		id?: string
		ariaLabel?: string
		[key: string]: unknown
	} = $props()

	// (Derived)
	const normalizedItems = $derived(
		items.map((item) => ({
			item,
			id: getItemId(item),
			label: getItemLabel(item),
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
					label: getItemLabel(item),
					disabled: getItemDisabled ? getItemDisabled(item) : false,
				})),
			}))
		:
			[],
	)


	// Functions
	import { stringify } from 'devalue'


	// Components
	import { Select } from 'bits-ui'
</script>


<Select.Root
	{...rootProps}
	type="single"
	bind:value={() => (value != null ? getItemId(value) : ''), (v) => {
		value = normalizedItems.find((item) => item.id === v)?.item ?? undefined
	}}
	{disabled}
	{name}
	{allowDeselect}
	items={normalizedItems.map((item) => ({
		value: item.id,
		label: item.label,
		disabled: item.disabled,
	}))}
>
	{#if children}
		{@render children()}
	{:else}
		{@const selectedId = value != null ? getItemId(value) : ''}
		<Select.Trigger id={id ?? _id} aria-label={ariaLabel}>
			<span data-row>
				{#if Before}
					{@render Before()}
				{/if}
				<span>{normalizedItems.find((item) => item.id === selectedId)?.label ?? placeholder ?? ''}</span>
				{#if After}
					{@render After()}
				{/if}
			</span>
		</Select.Trigger>
		<Select.Portal>
			<Select.Content>
				<Select.Viewport>
					{#if normalizedGroups.length > 0}
						{#each normalizedGroups as group (group.id)}
							<Select.Group>
								<Select.GroupHeading>{group.label}</Select.GroupHeading>
								{#each group.items as item (item.id)}
									<Select.Item
										value={item.id}
										label={item.label}
										disabled={item.disabled}
									>
										{#snippet children({ selected })}
											<span data-row="gap-1">
												<span data-row-item="flexible">
													{#if ItemSnippet}
														{@render ItemSnippet(item.item, selected)}
													{:else}
														{item.label}
													{/if}
												</span>
												<span
													class="select-item-check"
													aria-hidden="true"
													data-selected={selected}
												>
													✓
												</span>
											</span>
										{/snippet}
									</Select.Item>
								{/each}
							</Select.Group>
						{/each}
					{:else}
						{#each normalizedItems as item (item.id)}
									<Select.Item
										value={item.id}
										label={item.label}
										disabled={item.disabled}
									>
										{#snippet children({ selected })}
											<span data-row="start gap-1">
												<span data-row-item="flexible">
													{#if ItemSnippet}
														{@render ItemSnippet(item.item, selected)}
													{:else}
														{item.label}
													{/if}
												</span>
												<span
													class="select-item-check"
													aria-hidden="true"
													data-selected={selected}
												>
													✓
												</span>
											</span>
										{/snippet}
									</Select.Item>
						{/each}
					{/if}
				</Select.Viewport>
			</Select.Content>
		</Select.Portal>
	{/if}
</Select.Root>


<style>
	.select-item-check {
		display: inline-flex;
		inline-size: 1em;
		justify-content: center;
		visibility: hidden;
	}
	.select-item-check[data-selected='true'] {
		visibility: visible;
	}
</style>
