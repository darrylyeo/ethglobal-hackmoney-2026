<script lang="ts">
	// Props
	let { children } = $props()

	// State
	import { networkStatus } from '$/lib/network-status.svelte'
	import { networks } from '$/constants/networks'

	let showGraph =
		$state(false)

	// (Derived)
	$effect(() => {
		const chainIds = networks.map((n) => n.id)
		networkStatus.start(chainIds)
		return () => networkStatus.stop()
	})

	// Components
	import Boundary from '$/components/Boundary.svelte'
	import Navigation from '$/views/Navigation.svelte'
	import NetworkStatusIndicator from '$/routes/NetworkStatusIndicator.svelte'
	import ToastContainer from '$/components/ToastContainer.svelte'
	import GraphScene from '$/routes/GraphScene.svelte'


	// Images
	import favicon from '$/lib/assets/favicon.svg'


	// Styles
	import '$/styles/reset.css'
	import '$/styles/colors.css'
	import '$/styles/fonts.css'
	import '$/styles/components.css'
	import '$/styles/accessibility.css'
	// import '$/styles/responsive.css'
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
	<a href="#main-content" class="skip-link">Skip to main content</a>

		<Navigation
			navigationItems={[
			{
				id: 'bridge',
				title: 'Bridge',
				href: '/bridge',
			},
			{
				id: 'swap',
				title: 'Swap',
				href: '/swap',
			},
			{
				id: 'liquidity',
				title: 'Liquidity',
				href: '/liquidity',
			},
			{
				id: 'transfers',
				title: 'Transfers',
				href: '/transfers',
			},
			{
				id: 'rooms',
				title: 'Rooms',
				href: '/rooms',
			},
			{
				id: 'tests',
				title: 'Tests',
				children: [
					{
						id: 'test-collections',
						title: 'Collections',
						href: '/test/collections',
					},
					{
						id: 'test-networks-coins',
						title: 'Networks & coins',
						href: '/test/networks-coins',
					},
					{
						id: 'test-chain-id',
						title: 'Chain ID (Voltaire)',
						href: '/test/chain-id',
					},
				],
			},
		]}
		>
			{#snippet headerActions()}
				<NetworkStatusIndicator />
			{/snippet}
		</Navigation>

	<main id="main-content" tabindex="-1">
		<Boundary>
			{@render children()}

			{#snippet Failed(error, retry)}
				<div data-column>
					<h2>Error</h2>
					<p>{error instanceof Error ? error.message : String(error)}</p>
					<button type="button" onclick={retry}>Retry</button>
				</div>
			{/snippet}
		</Boundary>
	</main>

	<ToastContainer
		position="bottom-right"
	/>

	<button
		type="button"
		data-graph-toggle
		onclick={() => { showGraph = !showGraph }}
		title={showGraph ? 'Hide data graph' : 'Show data graph'}
	>
		{showGraph ? '✕' : '◉'}
	</button>

	<GraphScene visible={showGraph} />
</div>


<style>
	#layout {
		/* Constants */
		--navigation-desktop-inlineSize: 20rem;
		--navigation-mobile-blockSize: 4.16rem;

		/* Rules */
		width: 100dvw;
		height: 100dvh;
		padding:
			var(--safeArea-insetTop)
			var(--safeArea-insetRight)
			var(--safeArea-insetBottom)
			var(--safeArea-insetLeft)
		;
		display: grid;
		align-items: start;
		gap: var(--separator-width);

		&[data-scroll-container] {
			--sticky-paddingBlockStart: var(--safeArea-insetTop);
			--sticky-paddingBlockEnd: var(--safeArea-insetBottom);
			--sticky-paddingInlineStart: var(--safeArea-insetLeft);
			--sticky-paddingInlineEnd: var(--safeArea-insetRight);
		}

		@media not (max-width: 1024px) {
			grid-template:
				'Nav Main' 100dvh
				/ var(--navigation-desktop-inlineSize) minmax(auto, 1fr);

			&[data-sticky-container] {
				--sticky-marginInlineStart: var(--separator-width);
				--sticky-paddingInlineStart: var(--navigation-desktop-inlineSize);
			}
		}

		@media (max-width: 1024px) {
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

		> :global(nav) {
			grid-area: Nav;
			box-shadow: 0 0 0 var(--separator-width) var(--border-color);
		}

		> main {
			grid-area: Main;
		}
	}

	[data-graph-toggle] {
		position: fixed;
		bottom: 1rem;
		right: 460px;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--color-bg-page, #fff);
		border: 1px solid var(--color-border, #e5e7eb);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		font-size: 0.75rem;
		z-index: 51;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;

		&:hover {
			transform: scale(1.1);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
			background: var(--color-bg-elevated, #f8fafc);
		}
	}
</style>
