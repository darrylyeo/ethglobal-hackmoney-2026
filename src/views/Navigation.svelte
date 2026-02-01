<script lang="ts">
	// Context
	import { page } from '$app/state'


	// Props
	let {
		navigationItems
	}: {
		navigationItems: NavigationItem[]
	} = $props()


	// Components
	import NetworkStatusIndicator from '$/components/NetworkStatusIndicator.svelte'
	import NavigationItems, { type NavigationItem } from './NavigationItem.svelte'
</script>


<nav
	id="nav"
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
			<li>
				<NetworkStatusIndicator />
			</li>

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
	nav {
		width: 100%;
		height: 100dvh;
		display: grid;
		grid-template-rows: auto 1fr auto;

		&[data-sticky-container] {
			--sticky-paddingBlockStart: var(--navigation-mobile-blockSize);
		}

		> header {
			block-size: var(--navigation-mobile-blockSize);
			box-shadow: 0 0 0 var(--separator-width) var(--border-color);

			padding: 1rem;

			a {
				display: flex;
				text-decoration: none;

				.logo {
					font-size: 1.1em;
					text-transform: uppercase;

					.title {
						letter-spacing: 0.08em;
						font-weight: 700;
					}

					[data-tag] {
						letter-spacing: 0.06em;
						font-size: 0.6em;
					}
				}
			}

			menu {
				li {
					display: contents;
				}

				button {
					svg {
						width: 1.25em;
						height: 1.25em;

						transition-property: color;
					}
				}

			}
		}

		#nav-menu {
			padding: 1rem 0.75rem;

			&[data-sticky-container] {
				--sticky-marginBlockStart: 1rem;
				--sticky-marginBlockEnd: 1rem;
				--sticky-marginInlineStart: 0.75rem;
				--sticky-marginInlineEnd: 0.75rem;

				--sticky-paddingBlockStart: 5rem;
			}
		}

		footer {
			padding: 1rem;

			p {
				padding: 0.75rem 1rem;
				line-height: 1.4;
				background-color: var(--accent-backgroundColor);
				border-radius: 0.5rem;
				font-size: 0.875rem;
				color: var(--text-secondary);
			}
		}
	}

	@media (width >= 60rem) {
		li:has(#menu-toggle) {
			display: none;
		}
	}

	@media (width < 60rem) {
		nav {
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
