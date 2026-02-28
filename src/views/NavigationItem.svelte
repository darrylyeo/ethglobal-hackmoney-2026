<script
	module
	lang="ts"
>
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
	}: {
		items: NavigationItem[]
		currentPathname?: string
	} = $props()


	// Functions
	function navIconProps(icon: string): {
		icon?: string
		src?: string
	} {
		return (
			icon.startsWith('data:') || icon.startsWith('/') || icon.startsWith('http') ?
				{ src: icon }
				: { icon }
		)
	}


	// State
	import { SvelteMap } from 'svelte/reactivity'

	let searchValue = $state(
		''
	)
	let treeOpenState = $state(
		new SvelteMap<string, boolean>()
	)

	// (Derived)
	const searchQuery = $derived(
		searchValue.trim().toLowerCase()
	)


	// Components
	import Address, { AddressFormat } from '$/views/Address.svelte'
	import Icon from '$/components/Icon.svelte'
	import SearchableText from '$/components/SearchableText.svelte'
	import Tree from '$/components/Tree.svelte'
</script>


<search
	class="nav-items"
	data-column="gap-3"
>
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

	<Tree
		items={items}
		getKey={(item) => item.id}
		getChildren={(item) => item.children ?? item.allChildren}
		getIsOpen={(item) => treeOpenState.get(item.id) ?? (item.defaultIsOpen ?? false)}
		onIsOpenChange={(item, open) => {
			treeOpenState.set(item.id, open)
		}}
		getIsHidden={(item, getIsHidden) => (
			!!searchQuery
			&& !item.title.toLowerCase().includes(searchQuery)
			&& ((item.children ?? item.allChildren)?.every((child) => getIsHidden(child, getIsHidden)) ?? true)
		)}
		listTag="menu"
		listAttrs={{ 'data-column': 'gap-0' }}
		detailsAttrs={{ 'data-sticky-container': '' }}
		summaryAttrs={{ 'data-sticky': '', 'data-row': 'start gap-2' }}
	>
		{#snippet Content({ node }: { node: NavigationItem })}
			{#if node.href}
				<a
					href={node.href}
					data-row="start"
					aria-current={currentPathname === node.href ? 'page' : undefined}
					onmouseenter={() => {
						if (node.href && !node.href.startsWith('http')) {
							preloadData(node.href)
						}
					}}
					{...node.href.startsWith('http') && {
						target: '_blank',
						rel: 'noopener noreferrer',
					}}
				>
					<span
						data-row="start"
						data-row-item="flexible"
					>
						{#if node.address}
							<Address
								actorId={node.address.network ? { $network: node.address.network, address: node.address.address } : undefined}
								network={node.address.network}
								address={node.address.address}
								format={AddressFormat.MiddleTruncated}
								isLinked={false}
								showAvatar={true}
							/>
						{:else if node.icon}
							<Icon
								{...navIconProps(node.icon)}
								size="1em"
							/>
						{/if}

						{#if !node.address}
							<SearchableText
								text={node.title}
								query={searchQuery}
							/>
						{/if}
					</span>

					{#if node.tag || node.manualWatch}
						<span data-row="start gap-1">
							{#if node.tag}
								<span
									data-tag={node.tag}
									data-row="start gap-1"
								>
									{#if node.tagIcon}
										<Icon
										{...navIconProps(node.tagIcon)}
										size="1em"
									/>
									{/if}

									{node.tag}
								</span>
							{/if}

							{#if node.manualWatch}
								<Icon
									icon="★"
									aria-label="Pinned"
									size="1em"
								/>
							{/if}
						</span>
					{/if}
				</a>
			{:else}
				<span data-row="start">
					<span
						data-row="start"
						data-row-item="flexible"
					>
						{#if node.address}
							<Address
								actorId={node.address.network ? { $network: node.address.network, address: node.address.address } : undefined}
								network={node.address.network}
								address={node.address.address}
								format={AddressFormat.MiddleTruncated}
								isLinked={false}
								showAvatar={true}
							/>
						{:else if node.icon}
							<Icon
								{...navIconProps(node.icon)}
								size="1em"
							/>
						{/if}

						{#if !node.address}
							<SearchableText
								text={node.title}
								query={searchQuery}
							/>
						{/if}
					</span>

					{#if node.tag || node.manualWatch}
						<span data-row="start gap-1">
							{#if node.tag}
								<span
									data-tag={node.tag}
									data-row="start gap-1"
								>
									{#if node.tagIcon}
										<Icon
										{...navIconProps(node.tagIcon)}
										size="1em"
									/>
									{/if}

									{node.tag}
								</span>
							{/if}

							{#if node.manualWatch}
								<Icon
									icon="★"
									aria-label="Pinned"
									size="1em"
								/>
							{/if}
						</span>
					{/if}
				</span>
			{/if}
		{/snippet}
	</Tree>
</search>


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
	}
</style>
