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
collections in `src/collections`, including:

- Identity: wallets, wallet connections, actors, rooms, room peers, shared
  addresses
- Assets: coins, token list coins, stork prices
- Protocols: bridge routes, swap quotes, uniswap pools, uniswap positions
- Transfers: transactions, transfer requests, transfer events, transfer graphs
- Yellow: channel states, channels, deposits, transfers
- Auth: SIWE challenges
- Dashboard: dashboard panels

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

## Acceptance criteria

- [ ] G6 view supports intent drag between graph nodes with the same intent
  semantics and previews as other views.
- [ ] Multi-selection uses `brush-select` and supports intent drag from the
  primary selection.
- [ ] GraphScene includes every collection from `src/collections` in the graph
  model (nodes or edges as appropriate).
- [ ] Each entity type uses a unique combination of G6 visual dimensions.
- [ ] Node and edge state styles cover hover, active, selected, and disabled.
- [ ] Reduced motion preferences disable or simplify animations.

## TODOs

- TODO: Confirm which collections should render as edges vs intermediate nodes.
- TODO: Define dimension mappings for each entity type.
- TODO: Validate icon/label assets for new entities.

## Status

Draft.

## Output when complete

`DONE`
