<script module lang="ts">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'

	export type NavigationItem = {
		id: string
		title: string
		icon?: string
		address?: { network?: Network$Id, address: `0x${string}` }
		href?: string
		tag?: string
		tagIcon?: string
		defaultIsOpen?: boolean
		manualWatch?: boolean
		children?: NavigationItem[]
		allChildren?: NavigationItem[]
	}
</script>


<script lang="ts">
	// Context
	import { preloadData } from '$app/navigation'

	// Props
	let {
		items,
		currentPathname,
	}: { items: NavigationItem[]; currentPathname?: string } = $props()

	// Functions
	function filterTree(nodes: NavigationItem[], query: string): NavigationItem[] {
		if (!query) return nodes
		return nodes.flatMap((n) => {
			const matches = n.title.toLowerCase().includes(query)
			const children = treeGetChildren(n)
			const filteredChildren = children ? filterTree(children, query) : []
			return matches || filteredChildren.length > 0 ?
				[{ ...n, children: filteredChildren.length ? filteredChildren : children }]
			: []
		})
	}
	function navIconProps(icon: string): { icon?: string; src?: string } {
		return icon.startsWith('data:') || icon.startsWith('/') || icon.startsWith('http') ?
			{ src: icon }
		: { icon }
	}
	const treeGetChildren = (item: NavigationItem) =>
		(item.children ?? item.allChildren ?? undefined)

	// State
	let searchValue = $state('')
	let treeOpenState = $state(new Map<string, boolean>())
	const treeIsOpen = (item: NavigationItem) =>
		(treeOpenState.get(item.id) ?? (item.defaultIsOpen ?? false))

	// (Derived)
	const query = $derived(searchValue.trim().toLowerCase())
	const filteredItems = $derived(filterTree(items, query))

	// Actions
	const treeOnOpenChange = (item: NavigationItem, open: boolean) => {
		treeOpenState = new Map(treeOpenState).set(item.id, open)
	}

	// Components
	import SearchableText from '$/components/SearchableText.svelte'
	import Icon from '$/components/Icon.svelte'
	import TreeNode from '$/components/TreeNode.svelte'
	import Address, { AddressFormat } from '$/views/Address.svelte'
</script>


<search class="nav-items" data-column="gap-3">
	<input
		type="search"
		data-sticky
		bind:value={searchValue}
		placeholder="Search (⌘+K)"
		{@attach (element) => {
			const abortController = new AbortController()

			let lastFocusedElement: HTMLElement | undefined = $state()

			globalThis.addEventListener(
				'keydown',
				(event) => {
					if (
						(event.metaKey || event.ctrlKey) &&
						event.key.toLowerCase() === 'k'
					) {
						event.preventDefault()

						if (document.activeElement instanceof HTMLElement)
							lastFocusedElement = document.activeElement

						element.focus()
					}
				},
				{ signal: abortController.signal },
			)

			element.addEventListener(
				'blur',
				() => {
					lastFocusedElement?.focus()
					lastFocusedElement = undefined
				},
				{ signal: abortController.signal },
			)

			return () => {
				abortController.abort()
				lastFocusedElement?.focus()
				lastFocusedElement = undefined
			}
		}}
		onkeyup={(event) => {
			if (event.key === 'Escape') event.currentTarget.blur()
		}}
	/>

	<TreeNode
		nodes={filteredItems}
		getKey={(item) => item.id}
		getChildren={treeGetChildren}
		isOpen={treeIsOpen}
		onOpenChange={treeOnOpenChange}
		Content={NavContent}
		listTag="menu"
		listAttrs={{ 'data-column': 'gap-0' }}
		detailsAttrs={{ 'data-sticky-container': '' }}
		summaryAttrs={{ 'data-sticky': '', 'data-row': 'start gap-2' }}
	/>
</search>

{#snippet NavContent({ node }: { node: NavigationItem })}
	{@render Linkable(node)}
{/snippet}

{#snippet Linkable(item: NavigationItem)}
	{#if item.href}
		<a
			href={item.href}
			data-row="start"
			aria-current={currentPathname === item.href ? 'page' : undefined}
			onmouseenter={() => {
				if (item.href && !item.href.startsWith('http')) {
					preloadData(item.href)
				}
			}}
			{...item.href.startsWith('http') && {
				target: '_blank',
				rel: 'noopener noreferrer',
			}}
		>
			<span data-row="start" data-row-item="flexible">
				{#if item.address}
					<Address
						actorId={item.address.network ? { $network: item.address.network, address: item.address.address } : undefined}
						network={item.address.network}
						address={item.address.address}
						format={AddressFormat.MiddleTruncated}
						isLinked={false}
						showAvatar={true}
					/>
				{:else if item.icon}
					<Icon {...navIconProps(item.icon)} size="1em" />
				{/if}

				{#if !item.address}
					<SearchableText text={item.title} query={query} />
				{/if}
			</span>
			{#if item.tag || item.manualWatch}
				<span data-row="start gap-1">
					{#if item.tag}
						<span data-tag={item.tag} data-row="start gap-1">
							{#if item.tagIcon}
								<Icon {...navIconProps(item.tagIcon)} size="1em" />
							{/if}
							{item.tag}
						</span>
					{/if}
					{#if item.manualWatch}
						<Icon icon="★" aria-label="Pinned" size="1em" />
					{/if}
				</span>
			{/if}
		</a>
	{:else}
		<span data-row="start">
			<span data-row="start" data-row-item="flexible">
				{#if item.address}
					<Address
						actorId={item.address.network ? { $network: item.address.network, address: item.address.address } : undefined}
						network={item.address.network}
						address={item.address.address}
						format={AddressFormat.MiddleTruncated}
						isLinked={false}
						showAvatar={true}
					/>
				{:else if item.icon}
					<Icon {...navIconProps(item.icon)} size="1em" />
				{/if}

				{#if !item.address}
					<SearchableText text={item.title} query={query} />
				{/if}
			</span>
			{#if item.tag || item.manualWatch}
				<span data-row="start gap-1">
					{#if item.tag}
						<span data-tag={item.tag} data-row="start gap-1">
							{#if item.tagIcon}
								<Icon {...navIconProps(item.tagIcon)} size="1em" />
							{/if}
							{item.tag}
						</span>
					{/if}
					{#if item.manualWatch}
						<Icon icon="★" aria-label="Pinned" size="1em" />
					{/if}
				</span>
			{/if}
		</span>
	{/if}
{/snippet}


<style>
	.nav-items {
		:global(menu) {
			gap: 2px;
			list-style: none;
			font-size: 0.975em;

			li {
				display: grid;
			}
		}

		:global(details[data-sticky-container]) {
			--sticky-marginBlockStart: 1.75rem;
			--sticky-paddingBlockStart: 0.5rem;
		}

		a {
			color: inherit;
			font-weight: inherit;

			&:hover {
				color: var(--accent);
				text-decoration: none;
			}

			&[aria-current] {
				background-color: var(--background-primary);
				font-weight: 700;
			}
		}

		:global(summary),
		a:not(:global(summary) a) {
			padding: 0.45rem 0.45rem;
			border-radius: 0.375rem;
			font-weight: 500;
			transition-property: opacity, scale, background-color, color, outline;

			&:hover:not(:has(a:hover)) {
				background-color: var(--background-primary);
				color: var(--accent);
			}

			&:focus {
				outline: 2px solid var(--accent);
				outline-offset: -1px;
			}

			&:active {
				background-color: var(--background-primary);
			}
		}

		:global(details:not([open]) > summary::after) {
			transform: perspective(100px) rotateX(180deg) rotate(-90deg);
		}

		:global(summary ~ *) {
			margin-inline-start: 1em;
			margin-block-start: 2px;
			padding-inline-start: 0.75em;
			box-shadow: -1px 0 var(--color-border);
		}

		:global(mark) {
			font-weight: 600;
			text-decoration: underline;
			background-color: transparent;
			color: inherit;
		}
	}
</style>
