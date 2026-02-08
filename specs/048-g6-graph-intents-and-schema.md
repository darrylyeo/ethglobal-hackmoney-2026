# Spec 048: G6 intents + schema-rich visualization

Extend the global G6 visualization to support intent drag semantics and render
all current schema objects using the full range of G6 visual dimensions.

## Scope

- G6 graph view intent drag behavior aligned with the entity intents spec.
- Graph model expands to include all TanStack DB collections.
- G6 styling uses size, shape, color, opacity, stroke, label, icon, badge,
  halo, shadow, zIndex, and animation dimensions for nodes and edges.

## Non-goals

- No Sigma parity requirements beyond existing behavior.
- No custom G6 plugins beyond documented behaviors and element configs.

## Intent drag in G6

- Use G6 node events (`node:dragstart`, `node:drag`, `node:dragend`,
  `node:dragenter`, `node:dragleave`, `node:drop`) to track source and target.
- Support multi-selection with `brush-select` and use the primary selected node
  as the drag source when multiple nodes are selected.
- Resolve intents using `specs/038-entity-intents.md` and reuse the preview UI
  from `specs/047-intent-drag-tooltip-previews.md`.
- Selecting a route navigates to the appropriate transaction session.

## Schema coverage

GraphScene expands the normalized graph model to include nodes and edges for all
non-UI-related collections in `src/collections`, including:

- Identity: wallets, wallet connections, actors, rooms, room peers, shared
  addresses
- Assets: coins, token list coins, stork prices
- Protocols: bridge routes, swap quotes, uniswap pools, uniswap positions
- Transfers: transactions, transfer requests, transfer events, transfer graphs
- Yellow: channel states, channels, deposits, transfers
- Auth: SIWE challenges

## G6 visual dimensions

Each entity type must map to a distinct set of G6 dimensions, using all of the
following where applicable:

- **Node dimensions:** size, shape, fill, stroke, lineWidth, lineDash, opacity,
  gradient, icon, label, label placement, label background, badge, halo, shadow,
  zIndex, anchorPoints, ports, state styles, and motion-safe animations.
- **Edge dimensions:** type (`line`, `quadratic`, `cubic`), lineWidth, stroke,
  lineDash, opacity, gradient, label, label background, label placement,
  endArrow, startArrow, control points, and state styles.

Use entity metadata (source, status, chain, token, direction, confidence,
recency) to encode differences across these dimensions.

## Entity/source visibility

- The global graph supports disabling specific entity types and, where
  applicable, (entity type, data source) combinations (e.g. hide TokenLists
  coins but keep other coins).
- Visibility state is persisted (e.g. session or local storage) so toggles
  survive navigation and refresh.
- **Default visibility:** On first load, the following are **disabled** (hidden):
  - Token list coins (entity type TokenListCoin / source TokenLists).
  - Entity types largely unrelated to the current user: Wallet, WalletConnection,
    BridgeRoute, SwapQuote, UniswapPool, UniswapPosition, CctpAllowance, CctpFee,
    Transaction, TransferGraph, YellowChannel, YellowChannelState, YellowDeposit,
    YellowTransfer, SiweChallenge, DashboardPanel.
- **Default visible:** User-centric types remain enabled: Actor, ActorCoin,
  ActorAllowance, Room, RoomPeer, SharedAddress, Session,
  TransferRequest, Network, Coin, StorkPrice, SessionSimulation (and
  any other in-graph types not listed as disabled above).

## Acceptance criteria

- [x] G6 view supports intent drag between graph nodes with the same intent
  semantics and previews as other views.
- [x] Multi-selection uses `brush-select` and supports intent drag from the
  primary selection.
- [x] GraphScene includes every collection from `src/collections` in the graph
  model (nodes or edges as appropriate).
- [x] Each entity type uses a unique combination of G6 visual dimensions.
- [x] Node and edge state styles cover hover, active, selected, and disabled.
- [x] Reduced motion preferences disable or simplify animations.
- [x] Graph scene allows toggling visibility per entity type; visibility state
  persists across navigation/refresh (localStorage key `graph-visible-entities`).
- [x] Initial default visibility: TokenListCoin and non-user entity types
  (Wallet, WalletConnection, BridgeRoute, SwapQuote, UniswapPool, UniswapPosition,
  CctpAllowance, CctpFee, Transaction, TransferGraph, Yellow*, SiweChallenge,
  DashboardPanel) are disabled; user-centric types (Actor, ActorCoin,
  ActorAllowance, Room, RoomPeer, SharedAddress, Session,
  TransferRequest, Network, Coin, StorkPrice, SessionSimulation) are
  enabled.
- [x] (Optional) Support (entity type, data source) combo toggles so e.g.
  TokenLists-sourced entities can be hidden independently of other sources.

## TODOs

- TODO: Confirm which collections should render as edges vs intermediate nodes.
- TODO: Define dimension mappings for each entity type.
- TODO: Validate icon/label assets for new entities.

## Status

Complete. Entity/source visibility and default-disabled behaviour implemented.
GraphScene initializes `visibleCollections` from `DEFAULT_VISIBLE_ENTITY_TYPES`,
reads/writes `graph-visible-entities` and `graph-hidden-entity-sources` in
localStorage. (Entity type, data source) combo toggles: `hiddenEntitySources`
Set, persisted as `graph-hidden-entity-sources`; node inclusion uses
`isEntitySourceVisible(entityType, row.$source)`; legend "By source" row with
toggles per ENTITY_SOURCE_COMBOS. 2026-02-05 PROMPT_build: optional AC
implemented; test:unit 44 Deno + 101 Vitest passed.

## Output when complete

`DONE`
