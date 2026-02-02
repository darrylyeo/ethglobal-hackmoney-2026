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

- Built-in modes: `drag-canvas`, `zoom-canvas`, `drag-node`, `click-select`,
  `brush-select`, `activate-relations`.
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

## User switcher

- Add a visible switcher near the graph controls that lets users choose:
  `Sigma` or `G6`.
- The selection persists for the session (e.g. in `$state()` and optionally
  local storage).
- Switching frameworks does not reset visible collections, selection, or hover.

## Acceptance criteria

- [ ] `SigmaGraph.svelte` is renamed to `SigmaGraphView.svelte` and references
      updated accordingly.
- [ ] `G6GraphView.svelte` renders the same nodes, edges, labels, and colors as
      the Sigma view for the same data input.
- [ ] GraphScene uses a normalized graph model that is passed to both renderers.
- [ ] A UI switcher lets users toggle between Sigma and G6 at any time.
- [ ] The selected framework persists through graph data updates and UI changes.
- [ ] G6 view enables drag, zoom, selection, and relation highlighting.
- [ ] G6 view uses hover/active/selected state styling and readable labels.
- [ ] G6 view respects reduced motion and color scheme preferences.
- [ ] Graph container is keyboard-focusable with clear ARIA text.
- [ ] Selection changes are announced via an `aria-live` region.

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

Incomplete.

## Output when complete

`DONE`
