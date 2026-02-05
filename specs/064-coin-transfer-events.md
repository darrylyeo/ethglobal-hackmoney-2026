# Spec 064: Coin transfer events list

Replace the broken transfer visualization on the coin page with a list of
transfer events. Use the same query upsert patterns as the network/block/
transaction pages (see Spec 063) for initial fetches and follow-up inserts.

## Scope

- Update the coin page to render a transfer events list derived from event data.
- Replace existing transfer visualization logic entirely.
- Use `<ItemsList>` for the event list.
- Adopt the data query upsert flow from Spec 063:
  - initial fetch-upsert for a seed range
  - `$effect` follow-up inserts for visible placeholder keys

## Data sources

- Events: transfer events for the selected coin derived from the TanStack DB
  collections already used by the coin page.
- Use event data only; do not introduce new RPC/indexer calls.

## UI behavior

- Render a list of transfer events on the coin page.
- Each item shows essential transfer metadata (tx hash, from, to, amount, time).
- Anchor hash links must work via `id` attributes on list items.
- Use semantic HTML and component primitives from `src/styles/components.css`.

## Acceptance criteria

- [ ] The coin page replaces the existing transfer visualization with a list of
  transfer events derived from event data.
- [ ] The list uses `<ItemsList>` and renders stable `id` attributes for
  hash-linking.
- [ ] The coin page adopts the same upsert pattern as the network/block/
  transaction pages (Spec 063) for initial fetch-upsert and `$effect` follow-up
  inserts for visible placeholder keys.
- [ ] No new loading or caching logic is introduced beyond the described upsert
  flow.
- [ ] The previous visualization logic is removed.

## TODOs

- TODO: Confirm which event collection and keying scheme should be used for
  transfer events on the coin page.

## Output when complete

`DONE`
