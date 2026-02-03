# Spec 047: Intent drag tooltip previews

Extend the entity intent system with drag previews that visualize possible
intents, draw a live arrow between drag endpoints, and transition into a new
transaction session on selection.

## Scope

- Intent drag sources and targets in the intent playground and dashboards.
- Live drag arrow rendering between source and target element rects.
- Tooltip previews anchored to the arrow midpoint.
- Post-drag intent selection that navigates to a new transaction session.
- View transitions linking drag endpoints and tooltip text to form fields.

## Non-goals

- No additional intent kinds beyond the existing resolution matrix.
- No legacy drag behaviors or fallback UI.

## Drag preview behavior

### During drag

- Track the drag start element rect and the current drag-over element rect.
- Render a single overlay SVG with a cubic Bezier path between rect centers.
- Arrow uses `marker-end`, `vector-effect="non-scaling-stroke"`, and a
  high-contrast stroke that adapts to theme.
- Tooltip is anchored to the path midpoint using `@floating-ui/dom` with a
  virtual reference point at the midpoint.

### On drag end

- The tooltip remains visible and lists the resolved intent routes.
- The list becomes selectable and retains the drag context.
- Dismissing the tooltip or starting a new drag clears the selection state and
  removes the arrow.

## Intent preview content

- Use the intent resolution and route enumeration from
  `specs/038-entity-intents.md`.
- Tooltip shows intent kind, route count, and a selectable list of route
  variants.
- Each route option yields a minimal initial form state for the target flow.

## Navigation integration

- Selecting a route navigates to the matching transaction flow route with the
  URL hash set to the stringified JSON initial state.
- If the user is in `/dashboard`, split a new panel for the target route instead
  of replacing the current panel.
- The new route is expected to convert the JSON hash into a transaction session
  per `specs/046-transaction-sessions.md`.

## View transitions

- Assign `view-transition-name` to:
  - Drag source element
  - Drag target element
  - Selected intent text in the tooltip
  - The corresponding form fields in the destination flow
- Use `view-transition-group` to bind the drag source and its form field, and
  the drag target and its form field, so they morph coherently during navigation.
- Disable view transitions when `prefers-reduced-motion` is set.

## Acceptance criteria

- [ ] Dragging between intent entities draws a live arrow between element rects.
- [ ] The arrow updates with pointer movement and respects reduced motion.
- [ ] A tooltip anchored to the arrow midpoint previews possible intents.
- [ ] After drag end, the tooltip list becomes selectable and persists until
  dismissed or a new drag starts.
- [ ] Selecting a route navigates to the target flow with a JSON hash.
- [ ] Dashboard selections open in a new panel when applicable.
- [ ] View transitions connect drag endpoints and selected intent text to their
  corresponding form fields.
- [ ] Drag preview uses a single SVG overlay and Floating UI for positioning.

## TODOs

- TODO: Confirm the minimal preview payload for each intent route.
- TODO: Decide whether arrow styling varies by intent kind.
- TODO: Validate which flows expose matching form fields for transitions.

## Status

Draft.

## Output when complete

`DONE`
