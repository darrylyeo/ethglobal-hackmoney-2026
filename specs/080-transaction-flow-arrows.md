# Spec 080: Flow arrows in Transaction component

Draw arrows in `<Transaction>` (see `specs/063-network-block-transaction-components.md`)
from the From address to the To address, using the same arrow style as the intent
drag arrow (Bezier path, marker-end, theme-aware). Optionally show value/ETH
flowing along the path when `tx.value` is non-zero, consistent with
`specs/079-coin-flow-intent-arrow.md`. Use the shared flow-arrow primitive from
`specs/081-shared-flow-arrows-coin-and-g6.md` when implemented (DRY).

## Scope

- **Component:** `src/components/network/Transaction.svelte`.
- **Arrow:** From the "From" &lt;dd&gt; (or the Address within it) to the "To"
  &lt;dd&gt; (or the Address / contract-creation text). Same path and styling as
  `DragArrow`: quadratic Bezier via `getBoxToBoxArrow` (e.g. `perfect-arrows`),
  `marker-end`, `vector-effect="non-scaling-stroke"`, stroke color from theme
  (e.g. `--color-accent` or neutral).
- **Placement:** Arrow is drawn when the transaction details are visible (e.g.
  when the &lt;details&gt; is open and `tx` is present). Source/target rects come
  from the From and To elements (use refs or wrapper elements with measurable
  bounds).
- **Value flow (optional):** When `tx.value` is non-zero and not `0x0`/`0x`,
  show native-currency (ETH) icons flowing along the arrow path: same technique
  as spec 079 (CSS `offset-path` / `offset-distance`, 3D tumble, loop). Respect
  `prefers-reduced-motion: reduce` (static icon at midpoint or no flow).
- **Layout:** Arrow does not change the existing layout of the &lt;dl&gt;; it is
  an overlay (e.g. absolutely positioned SVG or a sibling layer) within the
  Transaction card so it does not affect document flow.

## Non-goals

- No arrows for transactions that have no "To" (contract creation can still show
  arrow to the contract-creation label if desired; otherwise omit).
- No change to Trace or Event rendering from spec 063.

## Implementation notes

- **Path:** Use the shared flow-arrow primitive (spec 081): path from
  `sourceRect`/`targetRect`. Transaction passes rects from bound refs for the
  From and To &lt;dd&gt; (or inner Address wrappers).
- **Rects:** When &lt;details&gt; opens, measure the From and To elements (e.g.
  `getBoundingClientRect()`). If the Transaction is inside a scrollable area,
  consider re-measuring on scroll or using a relative container so the arrow
  stays aligned (e.g. overlay scoped to the Transaction card with
  position: relative on the card and absolute SVG inside).
- **Value flow:** Reuse the same asset and animation approach as spec 079: native
  currency icon (ETH) from assets, CSS path motion + 3D rotation; disable or
  simplify when `prefers-reduced-motion: reduce`.

## Acceptance criteria

- [x] When Transaction details are open and `tx` has From and To, an arrow is
  drawn from the From address area to the To address area using the same visual
  style as the intent drag arrow (Bezier path, arrowhead, theme stroke).
- [x] Arrow is an overlay that does not affect the existing &lt;dl&gt; layout.
- [x] (Optional) When `tx.value` is non-zero, ETH/icons flow along the arrow
  path with the same modern CSS path + 3D tumble as spec 079; reduced motion
  disables or simplifies the flow.
- [x] Contract-creation case (no `to`, but `contractAddress`) is handled
  (arrow to contract-creation label or omitted per implementation choice).

## Status

Complete. Transaction card is `position: relative`; From and To `<dd>` elements
bound via refs. On details open, rects measured relative to card. `FlowArrow`
rendered with `relative` mode, same stroke/arrowhead. ETH icon flows when
`tx.value` is non-zero. Contract creation: arrow draws to the
`contractAddress` `<dd>`.

## Output when complete

`DONE`
