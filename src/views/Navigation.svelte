<script lang="ts">
	// Types
	import type { Snippet } from 'svelte'

	// Context
	import { page } from '$app/state'


	// Props
	let {
		navigationItems,
		headerActions,
	}: {
		navigationItems: NavigationItem[]
		headerActions?: Snippet
	} = $props()


	// Components
	import NavigationItems, { type NavigationItem } from './NavigationItem.svelte'
</script>


<nav
	id="nav"
	class="nav"
	popover="auto"
	data-sticky
	data-scroll-container
	data-sticky-container
>
	<header
		data-sticky="block"
		data-row
		data-scroll-container
	>
		<a href="/" aria-label="USDC Tools home">
			<span
				class="logo"
				data-row="gap-1"
			>
				<span class="title">USDC</span>
				<span data-tag>Tools</span>
			</span>
		</a>

		<menu data-row="gap-2">
			{#if headerActions}
				<li>
					{@render headerActions()}
				</li>
			{/if}

			<li>
				<button type="button" id="menu-toggle" aria-label="Open menu" popovertarget="nav">
					<span aria-hidden="true">☰</span>
				</button>
			</li>
		</menu>
	</header>

	<div id="nav-menu" data-sticky-container>
		<NavigationItems
			items={navigationItems}
			currentPathname={page.url.pathname}
		/>
	</div>

	<footer data-sticky>
		
	</footer>
</nav>


<style>
	.nav {
		width: 100%;
		height: 100dvh;
		display: grid;
		grid-template-rows: auto 1fr auto;
	}

	.nav[data-sticky-container] {
		--sticky-paddingBlockStart: var(--navigation-mobile-blockSize);
	}

	.nav > header {
		block-size: var(--navigation-mobile-blockSize);
		box-shadow: 0 0 0 var(--separator-width) var(--border-color);
		padding: 1rem;
	}

	.nav > header a {
		display: flex;
		text-decoration: none;
	}

	.nav > header .logo {
		font-size: 1.1em;
		text-transform: uppercase;
	}

	.nav > header .title {
		letter-spacing: 0.08em;
		font-weight: 700;
	}

	.nav > header [data-tag] {
		letter-spacing: 0.06em;
		font-size: 0.6em;
	}

	.nav > header menu li {
		display: contents;
	}

	.nav > header menu button svg {
		width: 1.25em;
		height: 1.25em;
		transition-property: color;
	}

	.nav #nav-menu {
		padding: 1rem 0.75rem;
	}

	.nav #nav-menu[data-sticky-container] {
		--sticky-marginBlockStart: 1rem;
		--sticky-marginBlockEnd: 1rem;
		--sticky-marginInlineStart: 0.75rem;
		--sticky-marginInlineEnd: 0.75rem;
		--sticky-paddingBlockStart: 5rem;
	}

	.nav footer {
		padding: 1rem;
	}

	.nav footer p {
		padding: 0.75rem 1rem;
		line-height: 1.4;
		background-color: var(--accent-backgroundColor);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	@media (width >= 60rem) {
		.nav li:has(#menu-toggle) {
			display: none;
		}
	}

	@media (width < 60rem) {
		.nav {
			transition-property: block-size;
			block-size: auto;
		}

		.nav[popover]:not(:popover-open) {
			block-size: var(--navigation-mobile-blockSize);
			overflow: hidden;
			overscroll-behavior: none;
		}

		.nav[popover]:not(:popover-open) header ~ * {
			display: none;
			interactivity: inert;
			opacity: 0;
			pointer-events: none;
		}
	}
</style>
