<script lang="ts">
	// Profiles (boot/migrate before collections read from localStorage; browser-only)
	import { browser } from '$app/environment'
	import { ensureProfilesMeta } from '$/lib/profile.ts'
	if (browser) ensureProfilesMeta()


	// WebMCP (client-only; registers tools with navigator.modelContext when available)
	import { registerWebMcpTools } from '$/lib/webmcp/register.ts'


	// Types/constants
	import { NetworkEnvironment } from '$/constants/network-environment.ts'
	import { setHeliosFallbackNoticeHandler } from '$/lib/helios-rpc.ts'
	import { toasts } from '$/lib/toast.svelte.ts'
	import { NavigationItems } from '$/routes/navigationItems.svelte.ts'
	import { networkEnvironmentState } from '$/state/network-environment.svelte.ts'
	import {
		createLiveQueryContext,
		setGlobalLiveQueryContext,
		setLocalLiveQueryContext,
	} from '$/svelte/live-query-context.svelte.ts'


	// Context
	const globalLiveQueryCtx = createLiveQueryContext()
	const localLiveQueryCtx = createLiveQueryContext()
	setGlobalLiveQueryContext(globalLiveQueryCtx)
	setLocalLiveQueryContext(localLiveQueryCtx)


	// Props
	let { children } = $props()


	// Actions
	$effect(() => {
		if (browser) void registerWebMcpTools()
	})
	$effect(() => {
		setHeliosFallbackNoticeHandler((chainId) => {
			toasts.warning(
				`Helios unreachable for chain ${chainId}; using default RPC.`,
				{ title: 'Helios fallback' },
			)
		})
		return () => setHeliosFallbackNoticeHandler(null)
	})


	// (Derived)
	const nav = new NavigationItems({
		isTestnet: () =>
			networkEnvironmentState.current === NetworkEnvironment.Testnet,
		iconEth,
		iconUsdc,
	})


	// Components
	import { Tooltip } from 'bits-ui'
	import Boundary from '$/components/Boundary.svelte'
	import IntentDragPreview from '$/components/IntentDragPreview.svelte'
	import GraphScene from '$/routes/GraphScene.svelte'
	import Navigation from '$/views/Navigation.svelte'
	import ToastContainer from '$/views/ToastContainer.svelte'


	// Images
	import favicon from '$/assets/favicon.svg'
	import iconEth from '$/assets/coins/eth.svg?url'
	import iconUsdc from '$/assets/coins/usdc.svg?url'


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
	<link
		rel="icon"
		href={favicon}
	/>
</svelte:head>


<Tooltip.Provider>
	<div
		id="layout"
		data-scroll-container="layout-inline-panes snap-inline"
		data-sticky-container
	>
		<a
			href="#main"
			class="skip-link"
		>Skip to main content</a>

		<Navigation
			navigationItems={nav.items}
		/>

		<div
			id="main"
			tabindex="-1"
			data-scroll-item="pane-flexible"
			data-sticky-container
			data-column
		>
			<!-- <aside
				id="global-graph"
				data-sticky="backdrop-none"
			>
				<GraphScene
					queryStack={localLiveQueryCtx.stack}
					globalQueryStack={globalLiveQueryCtx.stack}
				/>
			</aside> -->

			<svelte:boundary>
				{@render children()}

				{#snippet failed(error, retry)}
					<main data-column>
						<h2>Error</h2>
						<p>{error instanceof Error ? error.message : String(error)}</p>
						{#if retry}
							<button type="button" onclick={retry}>Retry</button>
						{/if}
					</main>
				{/snippet}
			</svelte:boundary>
		</div>
	</div>

	<IntentDragPreview />

	<ToastContainer position="bottom-right" />
</Tooltip.Provider>


<style>
	#layout {
		/* Constants */
		--navigation-desktop-inlineSize: 21rem;
		--navigation-mobile-blockSize: 4rem;

		/* Rules */
		inline-size: 100dvw;
		block-size: 100dvh;
		padding: var(--safeArea-insetTop) var(--safeArea-insetRight) var(--safeArea-insetBottom) var(--safeArea-insetLeft);
		align-items: start;
		gap: var(--separator-width);

		&[data-scroll-container] {
			--sticky-paddingBlockStart: var(--safeArea-insetTop);
			--sticky-paddingBlockEnd: var(--safeArea-insetBottom);
			--sticky-paddingInlineStart: var(--safeArea-insetLeft);
			--sticky-paddingInlineEnd: var(--safeArea-insetRight);
		}

		@media (width >= 60rem) {
			&[data-scroll-container~='layout-inline-panes'] {
				--scrollPanes-paneStatic-inlineSize: var(--navigation-desktop-inlineSize);
			}
		}

		> .layout-nav :global(nav) {
			box-shadow: 0 0 0 var(--separator-width) var(--border-color);
		}

		> #main {
			--sticky-paddingInlineStart: clamp(1rem, 6cqi, 2rem);
			--sticky-paddingInlineEnd: clamp(1rem, 6cqi, 2rem);

			padding: 1.5rem;

			/* > :global(main) {
				--graph-scroll-blur-size: 1rem;

				position: relative;
				min-height: 100dvh;

				&::before,
				&::after {
					content: '';
					position: absolute;
					z-index: -1;
					inset: calc(-1 * var(--graph-scroll-blur-size));
					pointer-events: none;
					mask-image:
						linear-gradient(to bottom, transparent 0, black var(--graph-scroll-blur-size)),
						linear-gradient(to top, transparent 0, black var(--graph-scroll-blur-size)),
						linear-gradient(to right, transparent 0, black var(--graph-scroll-blur-size)),
						linear-gradient(to left, transparent 0, black var(--graph-scroll-blur-size))
					;
					mask-composite: intersect;
					mask-size: 100% 100%;
					mask-repeat: no-repeat;
				}

				&::before {
					backdrop-filter: blur(calc(8px * (1 - var(--graph-scroll-progress, 0))));
				}

				&::after {
					backdrop-filter: blur(calc(8px * var(--graph-scroll-progress, 0)));
					-webkit-backdrop-filter: blur(calc(8px * var(--graph-scroll-progress, 0)));
				}
			} */
		}
	}
</style>
