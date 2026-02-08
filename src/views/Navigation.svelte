<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'
	import { APP_NAME } from '$/constants/app.ts'


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
	import NetworkEnvironmentInput from '$/views/NetworkEnvironmentInput.svelte'
	import ProfileSwitcher from '$/views/ProfileSwitcher.svelte'
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
		<a
			href="/"
			aria-label="{APP_NAME} home"
			data-row="start gap-0"
		>
			<span data-card="padding-2" data-row="gap-1">
				<span class="title">Blockhead</span>
				<span data-badge>Vision</span>
			</span>
		</a>

		<a
			href="/#about"
			class="about-link"
			data-row="center"
			aria-label="About"
			title="About"
		>
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

	<div
		id="nav-menu"
		data-sticky-container
	>
		<NavigationItems
			items={navigationItems}
			currentPathname={page.url.pathname}
		/>
	</div>

	<footer data-sticky data-row="gap-2 align-center">
		<ProfileSwitcher />
		<NetworkEnvironmentInput />
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

				[data-card] {
					--bevel-highlight: light-dark(
						color-mix(in srgb, var(--color-bg) 92%, white),
						color-mix(in srgb, var(--color-bg) 95%, white)
					);
					--bevel-shadow: light-dark(
						color-mix(in srgb, var(--color-bg) 95%, black),
						color-mix(in srgb, var(--color-bg) 92%, black)
					);
					background: linear-gradient(
						145deg,
						var(--bevel-highlight) 0%,
						var(--card-backgroundColor) 50%,
						var(--bevel-shadow) 100%
					);
					box-shadow:
						inset 1px 1px 0 var(--bevel-highlight),
						inset -1px -1px 0 var(--bevel-shadow);
					font-size: 1.1em;
					text-transform: uppercase;

					.title {
						letter-spacing: 0.08em;
						font-weight: 700;
					}

					[data-badge] {
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

				#theme-toggle {
					> :first-child {
						color: light-dark(currentColor, transparent);
					}
					> :last-child {
						color: light-dark(transparent, currentColor);
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
