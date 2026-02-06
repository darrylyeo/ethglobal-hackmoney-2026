<script lang="ts" generics="Item">


	// Types/constants
	import type { Snippet } from 'svelte'

	type DropdownActionItem<Item> = {
		type: 'item'
		item: Item
		id?: string
		label?: string
		disabled?: boolean
		onSelect?: () => void
	}

	type DropdownSeparator = {
		type: 'separator'
		id?: string
	}

	type DropdownCheckboxItem = {
		type: 'checkbox'
		id?: string
		label: string
		checked: boolean
		disabled?: boolean
		onCheckedChange?: (checked: boolean) => void
	}

	type DropdownCheckboxGroup = {
		type: 'checkbox-group'
		id?: string
		label?: string
		items: readonly {
			id?: string
			label: string
			checked: boolean
			disabled?: boolean
			onCheckedChange?: (checked: boolean) => void
		}[]
	}

	type DropdownRadioGroup = {
		type: 'radio-group'
		id?: string
		label?: string
		value: string
		onValueChange?: (value: string) => void
		items: readonly {
			value: string
			label: string
			disabled?: boolean
		}[]
	}

	type DropdownDeclaredItem<Item> =
		| DropdownActionItem<Item>
		| DropdownSeparator
		| DropdownCheckboxItem
		| DropdownCheckboxGroup
		| DropdownRadioGroup

	type DropdownItem<Item> = Item | DropdownDeclaredItem<Item>

	type DropdownGroup<Item> = {
		id?: string
		label?: string
		items: readonly DropdownItem<Item>[]
	}

	type NormalizedItem<Item> =
		| {
				kind: 'item'
				id: string
				label: string
				disabled: boolean
				item: Item
				onSelect?: () => void
		  }
		| {
				kind: 'separator'
				id: string
		  }
		| {
				kind: 'checkbox'
				id: string
				label: string
				checked: boolean
				disabled: boolean
				onCheckedChange?: (checked: boolean) => void
		  }
		| {
				kind: 'checkbox-group'
				id: string
				label?: string
				checkboxes: {
					id: string
					label: string
					checked: boolean
					disabled: boolean
					onCheckedChange?: (checked: boolean) => void
				}[]
		  }
		| {
				kind: 'radio-group'
				id: string
				label?: string
				value: string
				onValueChange?: (value: string) => void
				radios: {
					id: string
					value: string
					label: string
					disabled: boolean
				}[]
		  }
		| {
				kind: 'group'
				id: string
				label?: string
				items: NormalizedItem<Item>[]
		  }

	const defaultItemLabel = (item: Item) => String(item)
	const isRecord = (value: unknown): value is Record<string, unknown> =>
		typeof value === 'object' && value !== null
	const isDeclaredItem = (
		value: unknown,
	): value is DropdownDeclaredItem<Item> =>
		isRecord(value) &&
		((value.type === 'item' && 'item' in value) ||
			value.type === 'separator' ||
			value.type === 'checkbox' ||
			value.type === 'checkbox-group' ||
			value.type === 'radio-group')
	const isGroup = (value: unknown): value is DropdownGroup<Item> =>
		isRecord(value) && Array.isArray(value.items) && !isDeclaredItem(value)


	// Props
	let {
		items = [],
		triggerLabel = '',
		triggerAriaLabel,
		triggerProps = {},
		contentProps = {},
		onItemSelect,
		getItemId = defaultItemLabel,
		getItemLabel = defaultItemLabel,
		getItemDisabled,
		Trigger,
		Item,
		CheckboxItem,
		RadioItem,
		children,
		...rootProps
	}: {
		items?: readonly (DropdownItem<Item> | DropdownGroup<Item>)[]
		triggerLabel?: string
		triggerAriaLabel?: string
		triggerProps?: Record<string, unknown>
		contentProps?: Record<string, unknown>
		onItemSelect?: (item: Item) => void
		getItemId?: (item: Item) => string
		getItemLabel?: (item: Item) => string
		getItemDisabled?: (item: Item) => boolean
		Trigger?: Snippet
		Item?: Snippet<[item: any]>
		CheckboxItem?: Snippet<
			[
				item: {
					label: string
					checked: boolean
				},
			]
		>
		RadioItem?: Snippet<
			[
				item: {
					label: string
					value: string
					checked: boolean
				},
			]
		>
		children?: Snippet
		[key: string]: unknown
	} = $props()


	// (Derived)
	const normalizedEntries: NormalizedItem<Item>[] = $derived(
		items.map((entry, index) =>
			isGroup(entry)
				? {
						kind: 'group',
						id: entry.id ?? entry.label ?? `group-${index}`,
						label: entry.label,
						items: entry.items.map((item, itemIndex) =>
							isDeclaredItem(item)
								? item.type === 'item'
									? {
											kind: 'item',
											id: item.id ?? getItemId(item.item),
											label: item.label ?? getItemLabel(item.item),
											disabled:
												item.disabled ??
												(getItemDisabled ? getItemDisabled(item.item) : false),
											item: item.item,
											onSelect: item.onSelect,
										}
									: item.type === 'separator'
										? {
												kind: 'separator',
												id: item.id ?? `separator-${itemIndex}`,
											}
										: item.type === 'checkbox'
											? {
													kind: 'checkbox',
													id: item.id ?? `checkbox-${itemIndex}`,
													label: item.label,
													checked: item.checked,
													disabled: item.disabled ?? false,
													onCheckedChange: item.onCheckedChange,
												}
											: item.type === 'checkbox-group'
												? {
														kind: 'checkbox-group',
														id: item.id ?? `checkbox-group-${itemIndex}`,
														label: item.label,
														checkboxes: item.items.map(
															(groupItem, groupIndex) => ({
																id: groupItem.id ?? `checkbox-${groupIndex}`,
																label: groupItem.label,
																checked: groupItem.checked,
																disabled: groupItem.disabled ?? false,
																onCheckedChange: groupItem.onCheckedChange,
															}),
														),
													}
												: {
														kind: 'radio-group',
														id: item.id ?? `radio-group-${itemIndex}`,
														label: item.label,
														value: item.value,
														onValueChange: item.onValueChange,
														radios: item.items.map((groupItem, groupIndex) => ({
															id: `${groupItem.value}-${groupIndex}`,
															value: groupItem.value,
															label: groupItem.label,
															disabled: groupItem.disabled ?? false,
														})),
													}
								: {
										kind: 'item',
										id: getItemId(item),
										label: getItemLabel(item),
										disabled: getItemDisabled ? getItemDisabled(item) : false,
										item,
									},
						),
					}
				: isDeclaredItem(entry)
					? entry.type === 'item'
						? {
								kind: 'item',
								id: entry.id ?? getItemId(entry.item),
								label: entry.label ?? getItemLabel(entry.item),
								disabled:
									entry.disabled ??
									(getItemDisabled ? getItemDisabled(entry.item) : false),
								item: entry.item,
								onSelect: entry.onSelect,
							}
						: entry.type === 'separator'
							? {
									kind: 'separator',
									id: entry.id ?? `separator-${index}`,
								}
							: entry.type === 'checkbox'
								? {
										kind: 'checkbox',
										id: entry.id ?? `checkbox-${index}`,
										label: entry.label,
										checked: entry.checked,
										disabled: entry.disabled ?? false,
										onCheckedChange: entry.onCheckedChange,
									}
								: entry.type === 'checkbox-group'
									? {
											kind: 'checkbox-group',
											id: entry.id ?? `checkbox-group-${index}`,
											label: entry.label,
											checkboxes: entry.items.map((groupItem, groupIndex) => ({
												id: groupItem.id ?? `checkbox-${groupIndex}`,
												label: groupItem.label,
												checked: groupItem.checked,
												disabled: groupItem.disabled ?? false,
												onCheckedChange: groupItem.onCheckedChange,
											})),
										}
									: {
											kind: 'radio-group',
											id: entry.id ?? `radio-group-${index}`,
											label: entry.label,
											value: entry.value,
											onValueChange: entry.onValueChange,
											radios: entry.items.map((groupItem, groupIndex) => ({
												id: `${groupItem.value}-${groupIndex}`,
												value: groupItem.value,
												label: groupItem.label,
												disabled: groupItem.disabled ?? false,
											})),
										}
					: {
							kind: 'item',
							id: getItemId(entry),
							label: getItemLabel(entry),
							disabled: getItemDisabled ? getItemDisabled(entry) : false,
							item: entry,
						},
		),
	)


	// Actions
	const onItemSelectInternal = (item: Item, onSelect?: () => void) =>
		onSelect ? onSelect() : onItemSelect?.(item)


	// Components
	import { DropdownMenu } from 'bits-ui'
</script>


<DropdownMenu.Root {...rootProps}>
	<DropdownMenu.Trigger
		aria-label={triggerAriaLabel}
		{...triggerProps}
	>
		{#if Trigger}
			{@render Trigger()}
		{:else}
			{triggerLabel}
		{/if}
	</DropdownMenu.Trigger>
	<DropdownMenu.Portal>
		<DropdownMenu.Content
			{...contentProps}
		>
			{#each normalizedEntries as entry (entry.id)}
				{#if entry.kind === 'separator'}
					<DropdownMenu.Separator />
				{:else if entry.kind === 'group'}
					<DropdownMenu.Group>
						{#if entry.label}
							<DropdownMenu.Item
								disabled
								data-dropdown-label
							>
								{entry.label}
							</DropdownMenu.Item>
						{/if}
						{#each entry.items as item (item.id)}
							{#if item.kind === 'separator'}
								<DropdownMenu.Separator />
							{:else if item.kind === 'checkbox'}
								{@const checkboxItem = item}
								<DropdownMenu.CheckboxItem
									bind:checked={() => checkboxItem.checked, (c) =>
										checkboxItem.onCheckedChange?.(c)}
									disabled={checkboxItem.disabled}
								>
									{#if CheckboxItem}
										{@render CheckboxItem({
											label: checkboxItem.label,
											checked: checkboxItem.checked,
										})}
									{:else}
										{checkboxItem.label}
									{/if}
								</DropdownMenu.CheckboxItem>
							{:else if item.kind === 'checkbox-group'}
								<DropdownMenu.Group>
									{#if item.label}
										<DropdownMenu.Item
											disabled
											data-dropdown-label
										>
											{item.label}
										</DropdownMenu.Item>
									{/if}
									{#each item.checkboxes as groupItem (groupItem.id)}
										<DropdownMenu.CheckboxItem
											bind:checked={() => groupItem.checked, (c) =>
												groupItem.onCheckedChange?.(c)}
											disabled={groupItem.disabled}
										>
											{#if CheckboxItem}
												{@render CheckboxItem({
													label: groupItem.label,
													checked: groupItem.checked,
												})}
											{:else}
												{groupItem.label}
											{/if}
										</DropdownMenu.CheckboxItem>
									{/each}
								</DropdownMenu.Group>
							{:else if item.kind === 'radio-group'}
								<DropdownMenu.RadioGroup
									bind:value={() => item.value, (v) => item.onValueChange?.(v)}
								>
									{#if item.label}
										<DropdownMenu.Item
											disabled
											data-dropdown-label
										>
											{item.label}
										</DropdownMenu.Item>
									{/if}
									{#each item.radios as groupItem (groupItem.id)}
										<DropdownMenu.RadioItem
											value={groupItem.value}
											disabled={groupItem.disabled}
										>
											{#snippet children({ checked })}
												{#if RadioItem}
													{@render RadioItem({
														label: groupItem.label,
														value: groupItem.value,
														checked,
													})}
												{:else}
													<span
														data-row="start gap-2"
													>
														<span
															class="dropdown-radio-check"
															aria-hidden="true"
															data-checked={checked}
														>
															✓
														</span>
														{groupItem.label}
													</span>
												{/if}
											{/snippet}
										</DropdownMenu.RadioItem>
									{/each}
								</DropdownMenu.RadioGroup>
							{:else if item.kind === 'item'}
								{@const menuItem = item}
								<DropdownMenu.Item
									disabled={menuItem.disabled}
									onclick={() =>
										onItemSelectInternal(menuItem.item, menuItem.onSelect)}
								>
									{#if Item}
										{@render Item(menuItem.item)}
									{:else}
										{menuItem.label}
									{/if}
								</DropdownMenu.Item>
							{/if}
						{/each}
					</DropdownMenu.Group>
				{:else if entry.kind === 'checkbox'}
					{@const checkboxItem = entry}
					<DropdownMenu.CheckboxItem
						bind:checked={() => checkboxItem.checked, (c) =>
							checkboxItem.onCheckedChange?.(c)}
						disabled={checkboxItem.disabled}
					>
						{#if CheckboxItem}
							{@render CheckboxItem({
								label: checkboxItem.label,
								checked: checkboxItem.checked,
							})}
						{:else}
							{checkboxItem.label}
						{/if}
					</DropdownMenu.CheckboxItem>
				{:else if entry.kind === 'checkbox-group'}
					<DropdownMenu.Group>
						{#if entry.label}
							<DropdownMenu.Item
								disabled
								data-dropdown-label
							>
								{entry.label}
							</DropdownMenu.Item>
						{/if}
						{#each entry.checkboxes as item (item.id)}
							<DropdownMenu.CheckboxItem
								bind:checked={() => item.checked, (c) =>
									item.onCheckedChange?.(c)}
								disabled={item.disabled}
							>
								{#if CheckboxItem}
									{@render CheckboxItem({
										label: item.label,
										checked: item.checked,
									})}
								{:else}
									{item.label}
								{/if}
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.Group>
				{:else if entry.kind === 'radio-group'}
					<DropdownMenu.RadioGroup
						bind:value={() => entry.value, (v) => entry.onValueChange?.(v)}
					>
						{#if entry.label}
							<DropdownMenu.Item
								disabled
								data-dropdown-label
							>
								{entry.label}
							</DropdownMenu.Item>
						{/if}
						{#each entry.radios as item (item.id)}
							<DropdownMenu.RadioItem
								value={item.value}
								disabled={item.disabled}
							>
								{#snippet children({ checked })}
									{#if RadioItem}
										{@render RadioItem({
											label: item.label,
											value: item.value,
											checked,
										})}
									{:else}
										<span
											data-row="start gap-2"
										>
											<span
												class="dropdown-radio-check"
												aria-hidden="true"
												data-checked={checked}
											>
												✓
											</span>
											{item.label}
										</span>
									{/if}
								{/snippet}
							</DropdownMenu.RadioItem>
						{/each}
					</DropdownMenu.RadioGroup>
				{:else if entry.kind === 'item'}
					{@const menuItem = entry}
					<DropdownMenu.Item
						disabled={menuItem.disabled}
						onclick={() =>
							onItemSelectInternal(menuItem.item, menuItem.onSelect)}
					>
						{#if Item}
							{@render Item(menuItem.item)}
						{:else}
							{menuItem.label}
						{/if}
					</DropdownMenu.Item>
				{/if}
			{/each}
			{#if children}
				{@render children()}
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>


<style>
	.dropdown-radio-check {
		display: inline-flex;
		inline-size: 1em;
		justify-content: center;
		visibility: hidden;
	}
	.dropdown-radio-check[data-checked='true'] {
		visibility: visible;
	}
</style>
