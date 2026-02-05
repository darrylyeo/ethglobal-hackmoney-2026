# Spec 058: GraphScene local query stacks

Make `GraphScene` accept local/global TanStack DB query stacks as props and ensure
every page/view that uses live queries registers a local stack for visualization.

## Scope

- `GraphScene` accepts explicit local/global query stacks and defaults to the
  appropriate live query contexts when props are omitted.
- All route pages and views that use `useLiveQuery` register their local query
  entries so the graph can highlight them (shared state + attachments).
- Highlight mapping covers the full set of graph entity nodes using row metadata.

## Non-goals

- Do not change collection schemas or query semantics.
- Do not add new graph UI beyond stack highlighting and dimension mapping.

## Acceptance criteria

- [x] `GraphScene` distinguishes local vs global query stacks when highlighting.
- [x] Pages/views using `useLiveQuery` register local query entries via
  `liveQueryLocalAttachmentFrom` (shared state, merged where multiple queries exist).
- [x] Highlight mapping recognizes query rows across all graph node types.
- [x] Visualization uses domain metadata for richer entity dimension mapping.

## Status

Complete. GraphScene accepts `queryStack` / `globalQueryStack` props and defaults to shared state when omitted; local vs global are distinguished in Sigma (nodeReducer/edgeReducer) and G6 (highlight vs globalHighlight state). G6GraphView accepts `globalHighlightedNodes` and applies dimmed styling. Layout provides global stack via `liveQueryAttachmentFrom`; session/+page, session/[id], sessions/+page, channels/yellow, rooms/[roomId]/channels, Accounts register local entries via `liveQueryLocalAttachmentFrom`. buildHighlightedNodes maps all graph entity types. Node details and collection drive dimension mapping.

## Output when complete

`DONE`
