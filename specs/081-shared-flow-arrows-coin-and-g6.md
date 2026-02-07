# Spec 081: Shared flow-arrow primitive; coin and G6 visualizations

Introduce a **single shared flow-arrow primitive** (path, stroke, arrowhead,
optional flowing icons) and use it in coin visualizations and in the G6 graph so
that intent drag (079), Transaction (080), coin transfer graph, transfer events
list, and G6 edges share the same visual language and code. Stay DRY.

## Shared primitive (DRY)

- **Path:** One implementation of “arrow path between two points”: e.g.
  `getBoxToBoxArrow(sourceRect, targetRect, options)` → quadratic Bezier path string
  (or path from two points + size for pad). Same as used by `DragArrow.svelte`
  (see specs 047, 079).
- **Rendering:** SVG path with `marker-end`, `vector-effect="non-scaling-stroke"`,
  stroke from theme (e.g. `--color-accent`). Expose a small component or
  utility that accepts `sourceRect`/`targetRect` (or `pathD`) and optionally
  `flow: { icon, symbol? }` for flowing icons along the path (079-style: CSS
  `offset-path` / `offset-distance`, 3D tumble; respect `prefers-reduced-motion`).
- **Location:** Shared code in e.g. `src/lib/flow-arrow.ts` (path math + path string)
  and a presentational component (e.g. `FlowArrow.svelte` or integrated into
  `DragArrow`) used by IntentDragPreview, Transaction (080), coin viz, and G6
  integration.
- **Refactor:** Once the primitive exists, `DragArrow` and Transaction (080)
  consume it so there is no duplicate path/stroke/flow logic.

## Coin visualizations

- **Transfer graph (LiveTransfers):** Used on the coin page
  (`src/routes/coin/[symbol]/+page.svelte`) and in `src/views/LiveTransfers.svelte`
  (Threlte canvas with nodes + `LineSegments` for edges). Draw **similar arrows**
  for each transfer edge (from → to): same stroke and arrowhead as the shared
  primitive. Option A: add an SVG overlay that receives node positions (e.g.
  projected to 2D from the same layout) and draws one arrow per edge using the
  shared path + stroke. Option B: keep Threlte lines but add a 2D overlay that
  draws only arrowheads and optional flow at the end of each edge. When an edge
  carries value (coin), optionally show coin icons flowing along that edge (same
  technique as 079). Respect reduced motion.
- **Transfer events list (coin page):** The list of transfer events (from, to,
  amount per row). For each visible row, draw an arrow from the “from” address
  (or cell) to the “to” address (or cell) using the shared primitive (rects from
  refs). Optionally show a small coin/amount flow along the arrow when amount &gt; 0.
  Same overlay approach as Transaction (080): no layout change.

## G6 visualization

- **Edge style alignment:** G6 edges (GraphScene → G6GraphView) already use
  `endArrow`, stroke, and types (line, quadratic, cubic). Align their **visual
  style** with the shared primitive: same stroke width (or scaled for graph
  density), same arrowhead semantics (direction, size), and theme color so that
  G6 “flow” edges look like the intent drag and Transaction arrows.
- **Flow along G6 edges (research):** For edges that represent value/transfer
  (e.g. balance, coin, transaction, swap, yellow transfer), optionally show
  icons flowing along the edge path. G6 (AntV) renders edges with its own path;
  options: (1) **Custom edge:** register a custom edge type that draws the edge
  path using the same stroke/arrow as the shared primitive and adds a “flow”
  layer (e.g. small icons animated along the path via G6’s API or by computing
  path from edge control points and using CSS/SVG animation). (2) **Overlay
  layer:** after G6 renders, query edge keyShape path (if exposed) or recompute
  path from source/target node positions and control points; render a separate
  SVG/HTML layer that draws flowing icons along those paths using the same
  offset-path + 3D tumble as 079. Prefer the approach that reuses the most code
  from the shared primitive and does not duplicate path math. Respect
  `prefers-reduced-motion` (no or static flow in G6 when set).

## Non-goals

- No change to graph data model or layout in G6 or LiveTransfers; only how
  edges (and optionally flow) are drawn.
- No new intent or transaction semantics; only visual consistency and reuse.

## Acceptance criteria

- [x] A shared flow-arrow primitive exists (path computation + optional flow
  rendering) and is used by DragArrow and by Transaction (080) so that 079/080
  logic is DRY.
- [x] Coin transfer graph (LiveTransfers): edges are drawn as arrows with the
  same stroke/arrowhead style as the shared primitive; optionally coin icons
  flow along edges when the edge represents value; reduced motion respected.
- [x] Coin page transfer events list: each row can show an arrow from from → to
  using the shared primitive; optional flow for amount; overlay, no layout
  change.
- [x] G6: edge stroke and arrow style are aligned with the shared primitive
  (theme, arrow shape). (Optional) For transfer/value-like edges, flowing icons
  along the edge path using the same technique as 079; implementation may use
  custom edge or overlay; reduced motion respected.

## Status

Complete. Shared primitive: `src/lib/flow-arrow.ts` (path math: `computeArrow`,
`arrowToPathD`, `arrowMidPoint`, constants) + `src/components/FlowArrow.svelte`
(SVG arrow path + optional CSS `offset-path` / 3D tumble flow icons). DragArrow
and Transaction use FlowArrow. Coin icon lookup: `src/lib/coin-icon.ts`
(`isCoinEntityType`, `getCoinIconUrl`). LiveTransfers: SVG arrow overlay using
same `computeArrow`/`arrowToPathD` for each edge. Coin page transfer events:
`TransferEventRow.svelte` with per-row FlowArrow. G6: value-relation edges
(balance, coin, transaction, swap, yellow, transferRequest) get thicker lines,
consistent vee arrowhead, halos — aligned with shared primitive style. Canvas
renderer precludes CSS-based flow; style alignment achieved.

## Output when complete

`DONE`
