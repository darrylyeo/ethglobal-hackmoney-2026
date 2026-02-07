# Spec 079: Coin icons flowing along intent arrow path

When the intent drag source is a coin-type entity, animate coin icons flowing
along the same path as the intent arrow (source → target) to reinforce
transfer/swap/bridge semantics.

## Scope

- Intent drag preview: when `sourcePayload.entity.type` is a coin entity type
  (ActorCoin, Coin, TokenListCoin), show animated coin icons along the arrow path.
- Reuse the same SVG path as `DragArrow` (quadratic Bezier from `perfect-arrows`
  `getBoxToBoxArrow`).
- Coin icon: use the asset for the dragged coin (symbol from entity id / row) per
  `specs/052-icon-svg-procurement.md`; fallback to a generic coin icon when asset
  is missing.
- Animation: icons move along the path from source toward target and rotate in
  all three dimensions (rotateX, rotateY, rotateZ) so they tumble as they flow.
  Use modern CSS path-based motion (`offset-path`, `offset-distance`,
  `offset-rotate`). Duration and count are configurable; loop while drag is active.
- Respect `prefers-reduced-motion: reduce`: no flowing animation; optionally show
  a static icon at path midpoint or omit the effect.

## Non-goals

- No change to arrow or tooltip behavior from specs 047 / 077.
- No flow animation for non-coin drag sources (e.g. Actor, UniswapPosition).

## Implementation notes

- **Path:** DragArrow computes `pathD` from `getBoxToBoxArrow` (M, Q segment).
  Either (a) pass the path (or arrowData) from IntentDragPreview into a sibling
  “coin flow” overlay, or (b) extend DragArrow with an optional slot/prop that
  receives source entity and renders the flow when type is coin. Option (b) keeps
  path and flow in one place and avoids duplicating path math.
- **Coin symbol:** For ActorCoin use row/entity symbol; for Coin use id symbol;
  for TokenListCoin use symbol. IntentDragPreview has `sourcePayload.entity`;
  entity id alone may not include symbol — may need a resolved coin label/symbol
  from collections or a small lookup when starting the drag.
- **Motion along path:** Use modern CSS path techniques: `offset-path: path(...)`
  with the same `pathD` (or an SVG path element referenced via `url(#id)`);
  animate `offset-distance` from 0 to 100% with a keyframes animation (loop).
  Use `offset-rotate` so the icon orients along the path tangent if desired, or
  combine with 3D rotation for a tumbling effect. Multiple icons: stagger
  `animation-delay` so several coins are visible along the path at once.
- **3D rotation:** Apply `transform: rotateX(...) rotateY(...) rotateZ(...)` (or
  `rotate3d`) with `perspective` on a parent so coins tumble in 3D as they move.
  Animate rotation via keyframes (e.g. different phase/speed per axis) so the
  motion is visibly three-dimensional.
- **Placement:** Icons rendered in the same overlay as the arrow (e.g. HTML
  elements positioned with `offset-path`, or a sibling SVG) so they share
  coordinate space and sit on top of the stroke without clipping.

## Acceptance criteria

- [ ] When the drag source entity type is ActorCoin, Coin, or TokenListCoin,
  coin icons are visible along the intent arrow path during drag.
- [ ] Icons use the coin asset for the dragged coin when available (per 052);
  fallback when asset is missing.
- [ ] Icons animate along the path from source toward target using CSS
  `offset-path` / `offset-distance` (or equivalent path-based motion); animation
  loops while the drag is active.
- [ ] Icons rotate in all three dimensions (3D tumble) as they flow, using
  `perspective` and `rotateX` / `rotateY` / `rotateZ` (or `rotate3d`).
- [ ] When `prefers-reduced-motion: reduce` is set, the flowing animation is
  disabled (static icon at midpoint or no coin flow).
- [ ] No functional change to arrow or tooltip; non-coin drag sources show no
  coin flow.

## Status

Not started.

## Output when complete

`DONE`
