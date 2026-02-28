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
		allowDeselect,
		id,
		ariaLabel,

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
							label: getItemLabel(item),
							disabled: getItemDisabled ? getItemDisabled(item) : false,
						})),
					}))
			: [],
	)
	const triggerLabel = $derived(
		(value ?? []).length === 0
			? (placeholder ?? '')
			: (value ?? [])
					.map((entry) => getItemId(entry))
					.map((id) => normalizedItems.find((item) => item.id === id)?.label ?? '')
					.join(', '),
	)
	const rootItems = $derived(
		normalizedItems.map((item) => ({
			value: item.id,
			label: item.label,
			disabled: item.disabled,
		})),
	)


	// Components
	import { Select } from 'bits-ui'
</script>


<Select.Root
	{...rootProps}
	type="multiple"
	bind:value={() => {
		return ((value ?? []) as _Item[]).map((entry) => getItemId(entry))
	}, (v) => {
		value = v.flatMap((id) => {
			const item = normalizedItems.find((entry) => entry.id === id)
			return item ? [item.item] : []
		})
	}}
	{disabled}
	{name}
	{allowDeselect}
	items={rootItems}
>
	{#if children}
		{@render children()}
	{:else}
		<Select.Trigger id={id ?? _id} aria-label={ariaLabel}>
			<span data-row>
				{#if Before}
					{@render Before()}
				{/if}
				<span>{triggerLabel}</span>
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
											<span data-row="start">
												<span
													class="select-item-check"
													aria-hidden="true"
													data-selected={selected}
												>
													✓
												</span>
												{#if ItemSnippet}
													{@render ItemSnippet(item.item, selected)}
												{:else}
													{item.label}
												{/if}
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
									<span data-row="start">
										<span
											class="select-item-check"
											aria-hidden="true"
											data-selected={selected}
										>
											✓
										</span>
										{#if ItemSnippet}
											{@render ItemSnippet(item.item, selected)}
										{:else}
											{item.label}
										{/if}
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
