<script module lang="ts">
	// Types
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
	import { page } from '$app/stores'
	import { preloadData } from '$app/navigation'
	import Address, { AddressFormat } from '$/views/Address.svelte'
	import Icon from '$/components/Icon.svelte'
	import TreeNode from '$/components/TreeNode.svelte'

	// Props
	let {
		items,
		currentPathname,
	}: { items: NavigationItem[], currentPathname?: string } = $props()

	// State
	let searchValue = $state('')
	let treeOpenState = $state(new Map<string, boolean>())

	// (Derived)
	const pathname = $derived(currentPathname ?? $page.url.pathname)
	const effectiveSearchValue = $derived(searchValue.trim().toLowerCase())

	const hasCurrentPage = (item: NavigationItem): boolean => (
		(
			item.href != null &&
			(
				pathname === item.href.split('#')[0] ||
				pathname.startsWith(item.href.split('#')[0] + '/')
			)
		) ||
		(item.allChildren ?? item.children)?.some(hasCurrentPage) === true
	)

	const effectiveChildren = (item: NavigationItem) =>
		item.allChildren && (effectiveSearchValue || hasCurrentPage(item))
			? item.allChildren
			: item.children

	const treeIsOpen = (item: NavigationItem) =>
		effectiveSearchValue
			? matchesSearch(item, effectiveSearchValue)
			: hasCurrentPage(item) ||
				(treeOpenState.get(item.id) ?? item.defaultIsOpen ?? false)

	const treeOnOpenChange = (item: NavigationItem, open: boolean) => {
		if (!effectiveSearchValue) treeOpenState = new Map(treeOpenState).set(item.id, open)
	}

	const treeGetChildren = (item: NavigationItem) => effectiveChildren(item) ?? undefined

	function matchesSearch(item: NavigationItem, query: string): boolean {
		if (!query) return true
		return (
			item.title.toLowerCase().includes(query) ||
			(item.allChildren ?? item.children)?.some((c) => matchesSearch(c, query)) === true
		)
	}

	function filterTree(nodes: NavigationItem[], query: string): NavigationItem[] {
		if (!query) return nodes
		return nodes.flatMap((n) => {
			const children = treeGetChildren(n)
			const filteredChildren = children ? filterTree(children, query) : []
			return matchesSearch(n, query) || filteredChildren.length > 0
				? [{ ...n, children: filteredChildren.length ? filteredChildren : children }]
				: []
		})
	}
	const filteredItems = $derived(filterTree(items, effectiveSearchValue))

	function escapeHtml(s: string): string {
		return s
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
	}
	function highlightText(text: string, query: string): string {
		if (!query) return escapeHtml(text)
		const esc = escapeHtml(text)
		const re = new RegExp(`(${escapeRegex(query)})`, 'gi')
		return esc.replace(re, '<mark>$1</mark>')
	}
	function escapeRegex(s: string): string {
		return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}
	function navIconProps(icon: string): { icon?: string; src?: string } {
		return icon.startsWith('data:') || icon.startsWith('/') || icon.startsWith('http')
			? { src: icon }
			: { icon }
	}
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
		Content={navContent}
		listTag="menu"
		listAttrs={{ 'data-column': 'gap-0' }}
		detailsAttrs={{ 'data-sticky-container': '' }}
		summaryAttrs={{ 'data-sticky': '', 'data-row': 'start gap-2' }}
	/>
</search>

{#snippet navContent({ node }: { node: NavigationItem })}
	{@render linkable(node)}
{/snippet}

{#snippet linkable(item: NavigationItem)}
	{#if item.href}
		<a
			href={item.href}
			data-row="start gap-2"
			aria-current={pathname === item.href ? 'page' : undefined}
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
			<span data-row="start gap-2" data-row-item="flexible">
				{#if item.address}
					<Address
						network={item.address.network}
						address={item.address.address}
						format={AddressFormat.MiddleTruncated}
						isLinked={false}
						showAvatar={true}
					/>
				{:else if item.icon}
					<Icon class="icon" {...navIconProps(item.icon)} />
				{/if}

				{#if !item.address}
					<span
						>{@html effectiveSearchValue
							? highlightText(item.title, effectiveSearchValue)
							: escapeHtml(item.title)}</span>
				{/if}
			</span>
			{#if item.tag || item.manualWatch}
				<span data-row="start gap-1">
					{#if item.tag}
						<span data-tag={item.tag} data-row="start gap-1">
							{#if item.tagIcon}
								<Icon class="tag-icon" {...navIconProps(item.tagIcon)} />
							{/if}
							{item.tag}
						</span>
					{/if}
					{#if item.manualWatch}
						<Icon class="icon manual-watch" icon="★" aria-label="Pinned" />
					{/if}
				</span>
			{/if}
		</a>
	{:else}
		<span data-row="start gap-2">
			<span data-row="start gap-2" data-row-item="flexible">
				{#if item.address}
					<Address
						network={item.address.network}
						address={item.address.address}
						format={AddressFormat.MiddleTruncated}
						isLinked={false}
						showAvatar={true}
					/>
				{:else if item.icon}
					<Icon class="icon" {...navIconProps(item.icon)} />
				{/if}

				{#if !item.address}
					<span
						>{@html effectiveSearchValue
							? highlightText(item.title, effectiveSearchValue)
							: escapeHtml(item.title)}</span>
				{/if}
			</span>
			{#if item.tag || item.manualWatch}
				<span data-row="start gap-1">
					{#if item.tag}
						<span data-tag={item.tag} data-row="start gap-1">
							{#if item.tagIcon}
								<Icon class="tag-icon" {...navIconProps(item.tagIcon)} />
							{/if}
							{item.tag}
						</span>
					{/if}
					{#if item.manualWatch}
						<Icon class="icon manual-watch" icon="★" aria-label="Pinned" />
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
		a {
			> .icon {
				display: flex;
				font-size: 1.25em;
				width: 1em;
				height: 1em;
				line-height: 1;

				:global(img),
				:global(svg) {
					border-radius: 0.125rem;
					width: 100%;
					height: 100%;
				}
			}
		}

		[data-tag] .tag-icon {
			display: flex;
			font-size: 0.9em;
			width: 1em;
			height: 1em;
			line-height: 1;
			flex-shrink: 0;
		}

		[data-tag] .tag-icon :global(img),
		[data-tag] .tag-icon :global(svg) {
			border-radius: 0.125rem;
			width: 100%;
			height: 100%;
		}

		:global(mark) {
			font-weight: 600;
			text-decoration: underline;
			background-color: transparent;
			color: inherit;
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
	}
</style>
