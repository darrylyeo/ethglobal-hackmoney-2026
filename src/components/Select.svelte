<script lang="ts" generics="Item">
	// Types/constants
	import type { Snippet } from 'svelte'


	// Functions
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
		allowDeselect,
		id,
		ariaLabel,
		getItemId = defaultItemLabel,
		getItemLabel = defaultItemLabel,
		getItemDisabled,
		Before,
		After,
		Item,
		children,
		...rootProps
	}: {
		items:
			| readonly Item[]
			| readonly { id?: string; label: string; items: readonly Item[] }[],
		value?: string | string[],
		type?: 'single' | 'multiple',
		placeholder?: string,
		disabled?: boolean,
		name?: string,
		allowDeselect?: boolean,
		id?: string,
		ariaLabel?: string,
		getItemId?: (item: Item) => string,
		getItemLabel?: (item: Item) => string,
		getItemDisabled?: (item: Item) => boolean,
		Before?: Snippet,
		After?: Snippet,
		Item?: Snippet<[item: Item, selected: boolean]>,
		children?: Snippet,
		[key: string]: unknown
	} = $props()


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
	const triggerLabel = $derived(
		type === 'multiple'
			? Array.isArray(value) && value.length > 0
				? normalizedItems
						.filter((item) => value.includes(item.id))
						.map((item) => item.label)
						.join(', ')
				: (placeholder ?? '')
			: ((typeof value === 'string'
					? normalizedItems.find((item) => item.id === value)?.label
					: null) ??
					placeholder ??
					''),
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

{#if type === 'multiple'}
	<Select.Root
		{...rootProps}
		type="multiple"
		bind:value={() => (Array.isArray(value) ? value : []), (v) => (value = v)}
		{disabled}
		{name}
		{allowDeselect}
		items={rootItems}
	>
		{#if children}
			{@render children()}
		{:else}
			<Select.Trigger {id} aria-label={ariaLabel}>
				<span data-row="gap-2">
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
												<span data-row="start gap-2">
													<span
														class="select-item-check"
														aria-hidden="true"
														data-selected={selected}
													>
														✓
													</span>
													{#if Item}
														{@render Item(item.item, selected)}
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
										<span data-row="start gap-2">
											<span
												class="select-item-check"
												aria-hidden="true"
												data-selected={selected}
											>
												✓
											</span>
											{#if Item}
												{@render Item(item.item, selected)}
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
{:else}
	<Select.Root
		{...rootProps}
		type="single"
		bind:value={() => (typeof value === 'string' ? value : ''), (v) => (value = v)}
		{disabled}
		{name}
		{allowDeselect}
		items={rootItems}
	>
		{#if children}
			{@render children()}
		{:else}
			<Select.Trigger {id} aria-label={ariaLabel}>
				<span data-row="gap-2">
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
												<span data-row="start gap-2">
													<span
														class="select-item-check"
														aria-hidden="true"
														data-selected={selected}
													>
														✓
													</span>
													{#if Item}
														{@render Item(item.item, selected)}
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
										<span data-row="start gap-2">
											<span
												class="select-item-check"
												aria-hidden="true"
												data-selected={selected}
											>
												✓
											</span>
											{#if Item}
												{@render Item(item.item, selected)}
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
{/if}


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
