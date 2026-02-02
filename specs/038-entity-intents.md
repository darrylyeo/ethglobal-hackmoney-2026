# Spec 038: Entity intents

Intents are two-entity actions assembled from TanStack DB entities. The system
derives a canonical intent (transfer, swap, bridge, or combinations) from a
`from` + `to` entity pair plus placement context, then enumerates possible
routes from existing flow data.

## Intent model

### Entity reference

Intent entities are references to TanStack DB rows:

```ts
type IntentEntityRef = {
	collection: string
	id: Record<string, unknown>
}
```

### Intent kinds

- `transfer` (same chain, same token, different actors)
- `swap` (same chain, different token, same actor)
- `bridge` (different chain, same token, same actor)
- `transfer+swap` (same chain, different token, different actors)
- `transfer+bridge` (different chain, same token, different actors)
- `swap+bridge` (different chain, different token, same actor)
- `transfer+swap+bridge` (different chain, different token, different actors)

### Constraints

Resolve intent from the two entities using:

- Actor equality: same vs different actor address
- Chain equality: same vs different chain ID
- Token equality: same vs different token address

Both entities MUST resolve to:

- `actor` address
- `chainId`
- `tokenAddress` (if available)

If required dimensions are missing, the intent is invalid.

### Placement context

Drag payloads include a minimal intent context:

```ts
type IntentDragPayload = {
	entity: IntentEntityRef
	context?: {
		placement: 'from' | 'to'
		source: string
	}
}
```

Drop targets identify placement as `from` or `to`.

## Intent resolution matrix

| actor | chain | token | intent |
| --- | --- | --- | --- |
| same | same | same | invalid |
| same | same | diff | swap |
| same | diff | same | bridge |
| same | diff | diff | swap+bridge |
| diff | same | same | transfer |
| diff | same | diff | transfer+swap |
| diff | diff | same | transfer+bridge |
| diff | diff | diff | transfer+swap+bridge |

## Routes and previews

1. **Swap** routes use `swap-quotes` collection.
2. **Bridge** routes use `bridge-routes` collection.
3. **Transfer** routes are selectable as:
	- Direct on-chain transfer
	- Yellow channel transfer

Combined intents produce the cartesian product of required routes, preserving
the sequence:

- `transfer+swap` or `swap+transfer` as required by context
- `swap+bridge` vs `bridge+swap` based on source/target chain
- `transfer+swap+bridge` produces all valid sequences

UI lists all possible routes and lets the user pick one. The preview renders
the flow components for the chosen route and uses TransactionFlow for
simulation/execution.

## Routes

### `/test/intents`

Manual intent playground for selecting or dragging entities from TanStack DB.

## Acceptance criteria

- [ ] `specs/038-entity-intents.md` exists with intent model, matrix, and routing notes.
- [ ] Intent resolution uses actor/chain/token equality to derive the intent kind.
- [ ] Drag payloads include entity ref + placement context, and drop targets
  capture `from`/`to`.
- [ ] `/test/intents` renders two slots (from/to), shows resolved intent, and
  lists possible routes.
- [ ] Selecting a route shows preview components for the flow(s) involved.
- [ ] Standalone `transfer` intent offers both direct and Yellow channel options.
- [ ] Standalone `transfer` intent uses a TransferFlow backed by TransactionFlow.
- [ ] Combined intents compute all valid route permutations from existing flows.
- [ ] Simulation/execution uses TransactionFlow for the selected route.

## TODOs

- TODO: Expand intent sources to include graph node drag payloads.
- TODO: Document which entity types map to actor/chain/token dimensions.

## Status

Not started.

## Output when complete

`DONE`
