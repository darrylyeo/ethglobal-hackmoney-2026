# Spec 077: Declarative intents and actions

Replaces the imperative intent resolution system (specs 038, 047-intents) with a
declarative model. Intents, actions, protocols, and invocation modalities are
defined as typed const arrays. Resolution is a function of entity-type matching
against invocation definitions, not a matrix of dimension equality.

## Supersedes

- `specs/038-entity-intents.md` — intent model, resolution matrix, route
  building.
- `specs/047-intent-drag-tooltip-previews.md` — drag preview navigation (now
  uses `resolveIntentForDrag` instead of `resolveIntent` + `buildIntentRoutes`).

Drag arrow rendering, view transitions, and session persistence from those specs
remain valid and are preserved.

## Data model

### Actions and protocols

Every executable step is an `ActionType` paired with a `Protocol`:

| ActionType | Protocols |
| --- | --- |
| Swap | UniswapV4, LiFi |
| Bridge | Cctp, LiFi |
| Transfer | Yellow |
| CreateChannel | Yellow |
| AddChannelMember | Yellow |
| CloseChannel | Yellow |
| AddLiquidity | UniswapV4 |
| RemoveLiquidity | UniswapV4 |

The `protocolActions` const array is the single source of truth for which
protocols support which actions. Derived lookups `actionsByProtocol` and
`protocolsByAction` are computed from it.

### Intent invocations

An `IntentInvocationDefinition` declares how an intent can be triggered:

```typescript
type IntentInvocationDefinition<_IntentEntityName extends string> = {
  modality: IntentInvocationModality   // e.g. DragAndDrop
  entities: {
    dragTarget: _IntentEntityName
    dropTarget: _IntentEntityName
  }
}
```

The modality determines how the system matches runtime events to intents.
Currently only `DragAndDrop` is supported.

### Intent entities

Each intent declares named entity slots with a required `EntityType` and an
optional `match` predicate:

```typescript
type IntentEntity<_IntentEntityName, _EntityType> = {
  name: _IntentEntityName
  type: _EntityType
  match?: (entityId: Record<string, unknown>) => (
    | { result: true; reason: string }
    | { result: false; error: string }
  )
}
```

### Intent definitions

```typescript
type IntentDefinition<_IntentEntityName extends string> = {
  type: IntentType
  label: string
  invocations: IntentInvocationDefinition<_IntentEntityName>[]
  entities: IntentEntity<_IntentEntityName>[]
  resolveOptions?: (entities: Record<_IntentEntityName, Entity>) => IntentOption[]
}
```

`resolveOptions` receives the matched entity IDs keyed by name and returns
`IntentOption[]`, each containing a label and an ordered sequence of
`ProtocolActionPayload` steps. It may throw to signal an invalid combination
(e.g. same-network bridge).

### Registered intents

| IntentType | Drag source | Drop target | Action sequence |
| --- | --- | --- | --- |
| SwapAndBridge | ActorCoin | ActorNetwork | Swap + Bridge |
| CreateChannelAndAddMember | Actor | Actor | CreateChannel + AddChannelMember |
| CreateChannelAddMemberAndTransfer | ActorCoin | Actor | CreateChannel + AddChannelMember + Transfer |
| AddLiquidity | ActorCoin | UniswapPool | AddLiquidity |
| RemoveLiquidity | UniswapPosition | Actor | RemoveLiquidity |

## Resolution

`resolveIntentForDrag(source, target)` in `src/lib/intents.ts`:

1. Iterates `intents` array.
2. For each intent, checks each `DragAndDrop` invocation.
3. Compares `source.type` against the drag entity's `EntityType` and
   `target.type` against the drop entity's `EntityType`.
4. Runs `match` predicates if present.
5. On first match, calls `resolveOptions` with entity IDs and returns
   `{ matched: true, intent, options }`.
6. If `resolveOptions` throws, returns `{ matched: true, intent, options: [],
   error }`.
7. If no intent matches, returns `{ matched: false }`.

## File layout

| File | Purpose |
| --- | --- |
| `src/constants/intents.ts` | Enums, types, `protocolActions`, `intents` array |
| `src/lib/intents.ts` | Derived lookups, `resolveIntentForDrag`, `intentEntityTypes` |
| `src/lib/intents/drag.ts` | Drag data serialization (unchanged) |
| `src/lib/intents/intentDraggable.svelte.ts` | `entityIntent`, `intentDraggable` attachment |
| `src/state/intent-drag-preview.svelte.ts` | Drag preview reactive state |
| `src/components/IntentDragPreview.svelte` | Drag arrow + tooltip with resolution + navigation |

### Removed files

- `src/lib/intents/resolveIntent.ts`
- `src/lib/intents/routes.ts`
- `src/lib/intents/registry.ts`

## Session integration

`IntentDragPreview` maps each `ActionType` to a `TransactionSessionAction`
string and builds a URL hash from the selected `IntentOption`:

```
#createChannel:{payload}|addChannelMember:{payload}|transfer:{payload}
```

The session page (`/session`) routes these actions:

| Session action | View |
| --- | --- |
| swap | SwapView |
| bridge | BridgeView |
| transfer | TransferView |
| addLiquidity, removeLiquidity, liquidity | LiquidityView |
| createChannel, addChannelMember, closeChannel | Channel placeholder |

Navigation links in the layout sidebar and home page reference the new action
hashes.

## Acceptance criteria

### Definition layer

- [x] `ActionType` enum includes Swap, Bridge, Transfer, CreateChannel,
  AddChannelMember, CloseChannel, AddLiquidity, RemoveLiquidity.
- [x] `Protocol` enum includes UniswapV4, LiFi, Yellow, Cctp.
- [x] `protocolActions` const array pairs each action with its supported
  protocols.
- [x] `intents` array declares all 5 intents from the table above, each with
  `type`, `label`, `invocations`, `entities`, and `resolveOptions`.
- [x] `ProtocolActionPayload` type narrows `payload` shape per `ActionType` via
  indexed access.
- [x] `IntentDefinition` generic links entity names across `invocations`,
  `entities`, and `resolveOptions`.
- [x] `actionsByProtocol` and `protocolsByAction` are derived from
  `protocolActions`.

### Resolution

- [x] `resolveIntentForDrag` returns `{ matched: true, intent, options }` when
  source and target entity types match an invocation.
- [x] `resolveIntentForDrag` returns `{ matched: false }` for unregistered
  entity-type pairs.
- [x] `resolveIntentForDrag` returns `{ matched: true, ..., error }` when
  `resolveOptions` throws.
- [x] Entity `match` predicates are called and can reject a match.
- [x] `intentEntityTypes` set is derived from all intent entity definitions.

### Drag-and-drop UI

- [x] Dragging an intent-eligible entity shows a live arrow to the pointer.
- [x] Dropping on a compatible entity resolves the intent and shows a tooltip
  with the intent label, option count, and selectable option buttons.
- [x] Dropping on an incompatible entity shows "No matching intent".
- [x] Selecting an option navigates to `/session` with a hash encoding the
  action sequence.
- [x] Escape or clicking outside dismisses the tooltip.
- [x] View transitions connect drag endpoints to session form fields.

### Session routing

- [x] `TransactionSessionAction` type includes createChannel,
  addChannelMember, closeChannel, addLiquidity, removeLiquidity.
- [x] `parseSessionHash` parses the new action strings.
- [x] `/session` routes addLiquidity/removeLiquidity to LiquidityView.
- [x] `/session` routes createChannel/addChannelMember/closeChannel to a
  channel view.
- [x] Navigation sidebar lists Transfer, Swap, Bridge, Add Liquidity, Remove
  Liquidity, Create Channel, Close Channel.

## E2E test requirements

All tests use Playwright against a dev server. Wallet state is seeded via
TanStack DB collection inserts (no real wallet required for intent resolution
tests).

### 1. Intent resolution unit tests (`src/lib/intents.test.ts`)

```
describe('resolveIntentForDrag')
  it('matches ActorCoin → ActorNetwork as SwapAndBridge')
  it('matches Actor → Actor as CreateChannelAndAddMember')
  it('matches ActorCoin → Actor as CreateChannelAddMemberAndTransfer')
  it('matches ActorCoin → UniswapPool as AddLiquidity')
  it('matches UniswapPosition → Actor as RemoveLiquidity')
  it('returns matched:false for Actor → UniswapPool (no intent)')
  it('returns matched:false for same entity type when no intent registered')
  it('returns error when resolveOptions throws')
  it('respects entity match predicates')

describe('derived lookups')
  it('actionsByProtocol maps each protocol to its action types')
  it('protocolsByAction maps each action to its protocols')
  it('intentEntityTypes contains all entity types from intent definitions')
```

### 2. Drag payload round-trip (`src/lib/intents/drag.spec.ts`)

Existing tests remain valid. No changes needed.

### 3. Drag-and-drop flow (Playwright: `tests/intents-drag-drop.spec.ts`)

```
test('drag ActorCoin to Actor shows Create Channel + Transfer intent')
  - Navigate to /test/intents
  - Seed two ActorCoin rows and one Actor row in TanStack DB
  - Drag an ActorCoin entity onto the "To" slot
  - Drop an Actor entity onto the "To" slot
  - Verify the resolved intent section shows "Create Channel + Transfer"
  - Verify the option "Create Yellow channel + Add member + Transfer" appears
  - Verify the option lists 3 action steps

test('drag ActorCoin to ActorCoin shows no matching intent')
  - Seed two ActorCoin rows
  - Set one as "from", other as "to"
  - Verify "No matching intent for these entity types" appears

test('selecting an intent option navigates to /session with correct hash')
  - Navigate to a page with draggable entities
  - Trigger a drag-drop that resolves an intent
  - Wait for tooltip to appear after dragend
  - Click the first option button
  - Verify URL contains /session# with the expected action segments
  - Verify the session page renders the correct action view
```

### 4. Session routing (Playwright: `tests/session-actions.spec.ts`)

```
test('navigating to /session#createChannel shows channel view')
  - Navigate to /session#createChannel
  - Verify page title is "Create Channel"
  - Verify "Yellow Network channel action" text is visible

test('navigating to /session#addLiquidity shows liquidity view')
  - Navigate to /session#addLiquidity
  - Verify page title is "Add Liquidity"

test('navigating to /session#removeLiquidity shows liquidity view')
  - Navigate to /session#removeLiquidity
  - Verify page title is "Remove Liquidity"

test('compound hash routes to session with multiple actions')
  - Navigate to /session#createChannel:{...}|addChannelMember:{...}
  - Verify the session page renders without error
```

### 5. Navigation links (Playwright: `tests/navigation.spec.ts`)

```
test('sidebar Actions section lists all action links')
  - Navigate to /dashboard
  - Verify sidebar contains: Transfer, Swap, Bridge, Add Liquidity,
    Remove Liquidity, Create Channel, Close Channel
  - Click "Create Channel" link
  - Verify navigation to /session#createChannel

test('home page lists updated action cards')
  - Navigate to /
  - Verify cards include: Add Liquidity, Remove Liquidity, Create Channel
```

### 6. Intent test page (Playwright: `tests/intents-test-page.spec.ts`)

```
test('registered intents section shows all 5 intents')
  - Navigate to /test/intents
  - Verify 5 intent cards are rendered
  - Verify each card shows type, entity names, and invocation modality

test('dropping entities into slots resolves intent')
  - Navigate to /test/intents
  - Seed ActorCoin and Actor entities
  - Click "From" button on an ActorCoin entity
  - Click "To" button on an Actor entity
  - Verify "Create Channel + Transfer" appears in resolved intent section
  - Verify option action steps are listed
```

## Status

Complete. Re-verification 2026-02-07 (PROMPT_build execute one spec, all specs complete; re-verify 077): all AC confirmed—ActionType/Protocol/protocolActions/intents in src/constants/intents.ts; resolveIntentForDrag, actionsByProtocol, protocolsByAction, intentEntityTypes in src/lib/intents.ts; match predicates; IntentDragPreview/session hash; session routing and nav; src/lib/intents.test.ts + resolve.spec.ts + drag.spec.ts; test:unit 44 Deno + 159 Vitest passed. Previous: Declarative intents in `src/constants/intents.ts` (ActionType, Protocol, protocolActions, intents with resolveOptions); `src/lib/intents.ts` (resolveIntentForDrag, actionsByProtocol, protocolsByAction, intentEntityTypes). Entity match predicate on CreateChannelAndAddMember toActor; unit tests in `src/lib/intents.test.ts` and `src/lib/intents/resolve.spec.ts`. IntentDragPreview builds session hash; session routing and nav links verified. E2E: session-actions (createChannel, addLiquidity, removeLiquidity, compound hash), navigation (sidebar/home links), intents-drag (registered intents, slots). Vitest includes `src/lib/**/*.test.ts`.

## Output when complete

`DONE`
