<script lang="ts">
	// Props
	let { children } = $props()


	// Components
	import Boundary from '$/components/Boundary.svelte'
	import Navigation from '$/views/Navigation.svelte'


	// Images
	import favicon from '$/lib/assets/favicon.svg'


	// Styles
	import '$/styles/reset.css'
	import '$/styles/colors.css'
	import '$/styles/fonts.css'
	import '$/styles/components.css'
	import '$/styles/bits-ui.css'
</script>


<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>


<div
	id="layout"
	data-scroll-container
	data-sticky-container
>
	<Navigation
		navigationItems={[
			{
				id: 'home',
				title: 'Home',
				href: '/',
			},
			{
				id: 'bridge',
				title: 'Bridge',
				href: '/bridge',
			},
			{
				id: 'test-collections',
				title: 'Test collections',
				href: '/test/collections',
			},
		]}
	/>

	<Boundary>
		{@render children()}

		{#snippet failed(error)}
			<main data-column>
				<h2>{(error as unknown as Error).status}</h2>

				<p>{(error as unknown as Error).message}</p>
			</main>
		{/snippet}
	</Boundary>
</div>


<style>
	#layout {
		/* Constants */
		--navigation-desktop-inlineSize: 16.5rem;
		--navigation-mobile-blockSize: 4rem;

		/* Rules */
		width: 100dvw;
		height: 100dvh;
		padding: var(--safeArea-insetTop) var(--safeArea-insetRight) var(--safeArea-insetBottom) var(--safeArea-insetLeft);
		display: grid;
		align-items: start;
		gap: var(--separator-width);

		&[data-scroll-container] {
			--sticky-paddingBlockStart: var(--safeArea-insetTop);
			--sticky-paddingBlockEnd: var(--safeArea-insetBottom);
			--sticky-paddingInlineStart: var(--safeArea-insetLeft);
			--sticky-paddingInlineEnd: var(--safeArea-insetRight);
		}

		@media (width >= 60rem) {
			grid-template:
				'Nav Main' 100dvh
				/ var(--navigation-desktop-inlineSize) minmax(auto, 1fr)
			;

			&[data-sticky-container] {
				--sticky-marginInlineStart: var(--separator-width);
				--sticky-paddingInlineStart: var(--navigation-desktop-inlineSize);
			}
		}

		@media (width < 60rem) {
			grid-template:
				'Nav' var(--navigation-mobile-blockSize)
				'Main' 1fr
				/ minmax(auto, 1fr)
			;

			&[data-sticky-container] {
				--sticky-marginBlockStart: var(--separator-width);
				--sticky-paddingBlockStart: var(--navigation-mobile-blockSize);
			}
		}

		:global {
			> nav {
				grid-area: Nav;
				box-shadow: 0 0 0 var(--separator-width) var(--border-color);
			}

			> main {
				grid-area: Main;

				--sticky-paddingInlineStart: clamp(1rem, 6cqi, 2rem);
				--sticky-paddingInlineEnd: clamp(1rem, 6cqi, 2rem);
			}
		}
	}
</style>
