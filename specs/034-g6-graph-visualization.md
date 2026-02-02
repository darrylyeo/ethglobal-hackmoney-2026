# Spec 034: G6 graph visualization parity with Sigma

Add a G6-based graph visualization that renders the same entities, layout, and
data as the existing Sigma visualization, while leveraging G6 styling, behavior,
and accessibility features. Rename existing graph components to distinguish
between frameworks and allow users to switch at any time.

## Scope

- **Route:** `src/routes/GraphScene.svelte`
- **Existing Sigma component:** rename `src/components/SigmaGraph.svelte` to
  `src/components/SigmaGraphView.svelte`
- **New G6 component:** `src/components/G6GraphView.svelte`
- **User switch:** Graph framework selector in `GraphScene` that toggles between
  Sigma and G6 without losing current graph state (filters, selection, hover).

## Data parity

- The same graph entities are rendered in both frameworks:
  wallets, wallet connections, actors, actor coins, actor allowances, bridge
  routes, transactions.
- Node/edge colors, sizes, labels, and ring-based layout match existing Sigma
  rules defined in `GraphScene`.
- GraphScene owns data assembly; rendering components receive a normalized
  graph model (nodes, edges, styles, metadata) that is framework-agnostic.

## G6 features to use

**Behavior**

- Built-in behaviors: `drag-canvas`, `zoom-canvas`, `drag-element`,
  `click-select`, `brush-select`, `hover-activate`.
- Fit/center on initial render and on layout change.
- Smooth zooming/panning with boundaries to avoid losing the graph.
- Keyboard shortcuts: arrows to pan, `+`/`-` to zoom, `Escape` to clear
  selection, `Enter` to focus selected node.

**Styles**

- Stateful styling for hover, active, and selected nodes/edges.
- Edge arrows and label backgrounds for clarity.
- High-contrast theme support via CSS variables and `prefers-color-scheme`.
- Respect `prefers-reduced-motion` by disabling or simplifying animations.

**Accessibility**

- Graph container is focusable (`tabindex="0"`) with `aria-label` describing the
  visualization and current selection count.
- Announce selection changes via `aria-live` region.
- Provide a keyboard-accessible list of entities that mirrors graph selection.
- Node labels are readable at standard zoom levels and are exposed as accessible
  text.

## G6 feature mapping by entity

Use built-in node/edge types, state styling, and behaviors from the G6 docs:

- **Wallets**
  - Node type: `image` when `icon` is available, otherwise `circle`.
  - Use `halo` in selected/highlight state to indicate focus.
- **Wallet connections**
  - Node type: `circle` with badges for status or actor counts.
  - Use `selected`/`active` state styles.
- **Actors**
  - Node type: `circle` with label background for legibility.
  - Enable `hover-activate` to highlight related edges.
- **Actor coins**
  - Node type: `donut` or `circle` with size/opacity mapped to balance.
  - Badge shows token symbol.
- **Actor allowances**
  - Node style: dashed stroke to indicate approvals.
  - Use `highlight` state to show attention.
- **Bridge routes**
  - Node type: `rect` or `diamond` to differentiate routing entities.
  - Label background to keep route names readable.
- **Transactions**
  - Node type: `diamond` or `triangle` for event semantics.
  - Use entrance/update animations when reduced motion is not requested.
- **Edges**
  - Use `endArrow` with arrow types for directionality.
  - Use `cubic`/`cubic-horizontal` where ring spacing is wide; `line` for short
    links.
  - Label background or auto-rotate labels for clarity.

**Docs reference**

- Behaviors overview: https://g6.antv.antgroup.com/en/manual/behavior/overview
- Drag canvas: https://g6.antv.antgroup.com/en/manual/behavior/drag-canvas
- Zoom canvas: https://g6.antv.antgroup.com/en/manual/behavior/zoom-canvas
- Brush select: https://g6.antv.antgroup.com/en/manual/behavior/brush-select
- Element state: https://g6.antv.antgroup.com/en/manual/element/state
- Node config: https://g6.antv.antgroup.com/en/manual/element/node/base-node
- Edge config: https://g6.antv.antgroup.com/en/manual/element/edge/base-edge
- Tooltip plugin: https://g6.antv.antgroup.com/en/manual/plugin/tooltip
- Minimap plugin: https://g6.antv.antgroup.com/en/manual/plugin/minimap

## User switcher

- Add a visible switcher near the graph controls that lets users choose:
  `Sigma` or `G6`.
- The selection persists for the session (e.g. in `$state()` and optionally
  local storage).
- Switching frameworks does not reset visible collections, selection, or hover.

## Acceptance criteria

- [x] `SigmaGraph.svelte` is renamed to `SigmaGraphView.svelte` and references
      updated accordingly.
- [x] `G6GraphView.svelte` renders the same nodes, edges, labels, and colors as
      the Sigma view for the same data input.
- [x] GraphScene uses a normalized graph model that is passed to both renderers.
- [x] A UI switcher lets users toggle between Sigma and G6 at any time.
- [x] The selected framework persists through graph data updates and UI changes.
- [x] G6 view enables drag, zoom, selection, and relation highlighting.
- [x] G6 view uses hover/active/selected state styling and readable labels.
- [x] G6 view respects reduced motion and color scheme preferences.
- [x] Graph container is keyboard-focusable with clear ARIA text.
- [x] Selection changes are announced via an `aria-live` region.

## Implementation notes

- Prefer a single `GraphModel` interface defined near `GraphScene` and shared by
  both components.
- Keep layout logic in GraphScene; renderers only apply it.
- Use G6 plugins sparingly: `Minimap` only if it improves navigation for dense
  graphs.
- Ensure graph resizing responds to container size changes.

## TODOs

- TODO: Confirm desired default framework (Sigma vs G6).
- TODO: Decide whether to persist the framework choice beyond session storage.
- TODO: Align graph selection UI with existing filters and entity lists.

## Status

Complete. SigmaGraphView.svelte (renamed from SigmaGraph), G6GraphView.svelte, GraphScene.svelte with normalized GraphModel from graph-model.ts. Framework switcher (Sigma/G6) with localStorage persistence. G6: drag-canvas, zoom-canvas, drag-element, click-select, brush-select, hover-activate, focus-element; node/edge states (selected, highlight, active) with halo; tooltip; allowance edges dashed; reduced motion and prefers-color-scheme respected. Graph container role="application", tabindex="0", aria-label; selection announced via aria-live in data-sr-only div. selectionAnnouncement and hoveredNodeEntries use $derived.by. Open TODOs are product decisions (default framework, persistence scope, selection UI alignment).

## Output when complete

`DONE`
