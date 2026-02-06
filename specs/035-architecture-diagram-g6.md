# Spec 035: Architecture diagram graph visualization (G6)

Create a G6-powered architecture diagram that explains how the app’s major
systems and data flows connect. The diagram should be a first-class page, with
clear labels, legend, and iconography, so contributors can understand the stack
and runtime dependencies at a glance.

## Scope

- **Route:** `src/routes/about/+page.svelte`
- **Graph component:** `src/routes/about/ArchitectureGraph.svelte`
- **Diagram model:** `src/routes/about/architecture-graph.ts` (normalized nodes/edges)
- **Icons:** use asset pipeline in `scripts/_sync-assets.ts` and `src/lib/assets/` (chains/, coins/, providers/)

## Diagram contents

### Core nodes

- **Client/UI:** SvelteKit app + Svelte 5 flows and visualization layers
- **State:** Svelte state + TanStack DB collections
- **Collections:** named collections for runtime data and sessions
- **Storage:** localStorage + sessionStorage persistence
- **Blockchain access:** Voltaire RPC + ABI registry
- **Bridge/Swap:** LI.FI routes + quotes
- **USDC bridge:** Circle CCTP / Bridge Kit
- **Swap/Liquidity:** Uniswap v4 + Universal Router
- **Transfers:** Voltaire logs + Covalent indexer fallback
- **Rooms:** PartyKit realtime rooms + SIWE challenges
- **Price/Oracle:** Stork price feeds
- **Payments/Channels:** Yellow state channels + custody
- **Wallets:** EIP-1193 wallet connections + EIP-6963 discovery
- **Explain:** Prompt API + hosted LLM fallback
- **Tooling:** Deno tasks, build pipeline, tests, scripts
- **Networks:** supported chains (use chain icons)

### Core edges

- UI → State: collections read/write
- State → Collections: live queries + persistence
- State → Services: Voltaire, LI.FI, Circle, Uniswap, Transfers, PartyKit, Stork, Yellow, Intents
- UI ↔ Wallets: chain switching + signing
- Services → External APIs: LI.FI, Circle, Stork, Covalent, PartyKit, Yellow
- Voltaire ↔ RPC providers: JSON-RPC calls
- Wallets ↔ Networks: transactions on chain
- Tooling → Runtime: dev/build/test flows (Deno tasks, Playwright, TEVM)

## Visual design

- Use a layered left-to-right layout (Client → State → Services → Networks).
- Nodes use distinct shapes per category: UI, state, collections/storage, service, tooling, network.
- Edges are directional with arrowheads and short labels (e.g. “quotes”, “RPC”).
- Provide a legend explaining colors/shapes and the chain icon usage.
- Highlight critical paths (bridge/swap) with stronger edge styling.

## Interactions

- Pan/zoom, drag-node, click-select, and fit-to-view.
- Hover shows node/edge metadata in a small details panel.
- Keyboard support: `+`/`-` zoom, arrows pan, `Escape` clears selection.
- Respect `prefers-reduced-motion` by disabling animations.

## Icon sourcing and attribution

- **Chains/brands:** use `src/lib/assets/chains/`, `src/lib/assets/providers/` (and coins/) synced by
  `scripts/_sync-assets.ts`. If a required asset is missing, add it to the relevant array in `src/constants/assets.ts`
  with a source comment; run `deno run -A scripts/_sync-assets.ts` to sync.
- **Non-chain icons:** prefer simple geometric shapes + labels; brand assets use the same sync script.

## Acceptance criteria

- [x] `ArchitectureGraph.svelte` renders the diagram with G6 and uses the
      normalized graph model from `architecture-graph.ts`.
- [x] The about route renders the diagram with a short textual intro and a
      legend that explains node/edge styling.
- [x] Nodes include all core systems listed above (runtime + tooling) and are
      connected by the listed edges.
- [x] The diagram uses chain/brand assets from `src/lib/assets/` for network and service nodes.
- [x] Pan/zoom, selection, hover details, and keyboard shortcuts work.
- [x] Reduced motion is respected (no animated transitions).
- [x] The diagram remains readable in both light and dark themes.

## TODOs

- TODO: Confirm the default chain set shown in the diagram.
- TODO: Decide if the diagram should be embedded on the home page as a preview.

## Status

Complete.

## Output when complete

`DONE`
