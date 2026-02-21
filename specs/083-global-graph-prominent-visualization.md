# Spec 083: Global graph visualization prominent layout

Make the global data graph (GraphScene) a first-class visual layer: place the canvas in a sticky aside before main content so that `<main>` scrolls over it, with a progressively ramped blur at the scroll boundary. Use layout primitives from `src/styles/components.css` and scroll-driven CSS so the canvas can adjust to scroll position without JS.

## Goals

- Graph canvas lives in an `<aside>` that is a **sibling before** the layout children snippet (i.e. before `<main>`).
- The Main grid area is the **scroll container**; the aside is **sticky** so the canvas stays in place while main content scrolls over it.
- **No Svelte state** for graph visibility: use native `<details>` to show/hide the visualization.
- **Scroll-aware canvas**: use modern CSS scroll-driven animations and local CSS variables so the graph can adjust its bounding rect from scroll position.

## Data scope: watched entities

The global graph's **default query scope** is the set of **watched entities**
(spec 084). Instead of querying all collections unconditionally, GraphScene
queries only data relevant to watched entities:

- **Default (no toggles):** graph nodes/edges come from the unified watched
  entity set (wallet-connection accounts, active sessions, recent transactions,
  manually watched entities).
- **Toggles/filters:** the existing entity-type and data-source toggles (in the
  GraphScene `<details>` UI) control what **additional** entities are loaded
  beyond the watched set. When a toggle is on, the corresponding collection is
  queried for all rows (current behavior). When off, only rows matching watched
  entities of that type are included.
- **Entity source filters** (`hiddenEntitySources` in `graphSceneState`) apply
  after the above, hiding rows from specific data sources.

This means the graph starts with a focused, user-relevant view and can be
expanded to show more data on demand.

### Query strategy

- The global live query stack (`registerGlobalLiveQueryStack`, spec 058)
  registers queries for watched entity data. GraphScene consumes these via
  `useGlobalQueries().stack`.
- For "expanded" entity types (user toggled on), GraphScene registers additional
  queries against the full collection (up to `GRAPH_SCENE_MAX_PER_COLLECTION`).
- This replaces the current approach where GraphScene queries every collection
  unconditionally.

## Layout structure

- Root layout grid unchanged: `Nav` and `Main` areas.
- **Main area** is a wrapper with `data-scroll-container` and `data-sticky-container` (layout primitives from `components.css`).
- Inside that wrapper, in order:
  1. **Aside** (`data-sticky`): contains a `<details>` whose content is the graph (GraphScene). Sibling before main so that in scroll order the canvas is "under" main.
  2. **Main**: contains the existing `data-scroll-item` section and Boundary with the children snippet.

So when the user scrolls the Main area, the sticky aside (and thus the canvas) stays fixed and main content scrolls over it.

## Blur overlay on main

In `+layout.svelte`, add a `:global` rule for `main`:

- **`::before`** and **`::after`**: negatively inset (extend outside main), so they sit over the canvas region.
- Use **masked gradients** (e.g. `mask-image: linear-gradient(...)`) so the blur ramps (e.g. transparent at one edge, opaque at the other).
- Apply **`backdrop-filter: blur(...)`** so that as main content scrolls over the canvas, the overlapping band is progressively blurred.

No JS; purely CSS so that scrolling main content over the sticky canvas creates a ramped blur effect at top/bottom (or start/end) of the visible main region.

## Scroll-driven animation and canvas rect

- Use **scroll-driven animations** (e.g. `animation-timeline: scroll()`, `animation-range`) to drive one or more **local CSS custom properties** (e.g. on the scroll container or the aside) that represent scroll position or "visible rect" (e.g. `--scroll-block-start`, `--graph-visible-block`).
- The graph canvas (or its container) uses these variables so it can **adjust its bounding rect** (size/position) in response to scroll, e.g. via CSS (width/height/inset using the variables) or by reading the variables in the graph component to set the canvas element's size. Prefer CSS so the canvas is "aware" of scroll without extra JS.

## Details for show/hide

- The graph UI (summary + canvas + legend) is the existing **`<details>`** inside GraphScene; that component lives in the aside. No extra wrapper details in the layout.
- **Do not** bind or read `open` in Svelte; do not manage open/closed state in component state. The user toggles visibility only via the native details toggle (summary click).

## Acceptance criteria

- [x] Main grid area is a scroll container using `data-scroll-container` and `data-sticky-container`; its first child is an aside with `data-sticky`, then main.
- [x] Aside contains `<details>`; the graph (GraphScene) is inside the details content; no Svelte state or button controls open/closed.
- [x] Layout uses only layout/sticky primitives from `src/styles/components.css` (no ad-hoc sticky/scroll logic).
- [x] Main has `:global` styles for `::before` and `::after`: negative inset, masked gradient, and `backdrop-filter: blur(...)` so content scrolling over the canvas shows a ramped blur.
- [x] Scroll-driven animation sets at least one CSS variable (e.g. scroll progress or visible block) that the canvas (or wrapper) can use for its bounding rect.
- [x] Graph toggle button and `showGraph` state are removed from the layout.
- [x] Default graph scope is the watched entity set (spec 084), not all collections. GraphScene uses global stack data for Wallet, WalletConnection, Session, Room when type is not in expandedEntities.
- [x] Entity-type toggles expand scope beyond watched entities. Sidebar "Expand scope (full collection)" multi-select adds types to expandedEntities; when a type is expanded, full collection query is used instead of stack.
- [x] Global query stack feeds graph data from watched entities (spec 058).

## Status

Complete. Layout and data scope implemented: default graph data from global stack (watched-entity-driven); expandedEntities toggles use full collection per type; state fixed (isVisible in default).
