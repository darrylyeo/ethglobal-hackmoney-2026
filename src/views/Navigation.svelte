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
	import Icon from '$/components/Icon.svelte'
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
	<header data-sticky="block" data-row data-scroll-container>
		<a href="/" aria-label="USDC Tools home">
			<span class="logo" data-row="gap-1">
				<span class="title">USDC</span>
				<span class="nav-tag">Tools</span>
			</span>
		</a>

		<a href="/about" class="about-link" aria-label="About" title="About">
			<Icon class="icon" icon="ℹ" label="About" />
		</a>

		<menu data-row="gap-2">
			{#if headerActions}
				<li>
					{@render headerActions()}
				</li>
			{/if}

			<li>
				<button
					type="button"
					id="menu-toggle"
					aria-label="Open menu"
					popovertarget="nav"
				>
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
		<footer data-sticky></footer>
	</div>
</nav>




<style>
	.nav {
		width: 100%;
		height: 100dvh;
		display: grid;
		grid-template-rows: auto 1fr auto;

		&[data-sticky-container] {
			--sticky-paddingBlockStart: var(--navigation-mobile-blockSize);
		}

		> header {
			block-size: var(--navigation-mobile-blockSize);
			box-shadow: 0 0 0 var(--separator-width) var(--color-border);
			padding: 1rem;

			a {
				display: flex;
				text-decoration: none;
			}

			.about-link {
				align-items: center;
				justify-content: center;
				padding: 0.35rem;
				border-radius: 0.375rem;
				color: inherit;

				&:hover {
					background-color: var(--background-primary);
					color: var(--accent);
				}

				& .icon {
					font-size: 1.15em;
				}
			}

			.logo {
				font-size: 1.1em;
				text-transform: uppercase;
			}

			.title {
				letter-spacing: 0.08em;
				font-weight: 700;
			}

			.nav-tag {
				letter-spacing: 0.06em;
				font-size: 0.6em;
			}

			menu li {
				display: contents;
			}
		}

		#nav-menu {
			display: flex;
			flex-direction: column;
			padding: 1rem 0.75rem;

			&[data-sticky-container] {
				--sticky-marginBlockStart: 1rem;
				--sticky-marginBlockEnd: 1rem;
				--sticky-marginInlineStart: 0.75rem;
				--sticky-marginInlineEnd: 0.75rem;
				--sticky-paddingBlockStart: 5rem;
			}

			> :first-child {
				flex: 1;
			}

			footer {
				padding: 1rem;
			}
		}
	}

	@media (width >= 60rem) {
		.nav {
			li:has(#menu-toggle) {
				display: none;
			}
		}
	}

	@media (width < 60rem) {
		.nav {
			transition-property: block-size;
			block-size: auto;

			&[popover]:not(:popover-open) {
				block-size: var(--navigation-mobile-blockSize);
				overflow: hidden;
				overscroll-behavior: none;

				header ~ * {
					display: none;
					interactivity: inert;
					opacity: 0;
					pointer-events: none;
				}
			}
		}
	}
</style>
