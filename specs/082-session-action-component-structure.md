# Spec 082: Session and action component structure

Reworks the component hierarchy under `/session` so that a single `<Session>`
owns the session entity (editable name, accounts, network toggle) and delegates
an ordered action list to `<ActionsSequence>`, which uses `<EditableItemsList>`
for add / delete / duplicate / reorder. Each `<Action>` manages one action
entry, exposes a `<Select>` for `ActionType`, and renders the established
three-column flow (Params | Protocol | Preview) with type-specific column
content from dedicated components.

## Supersedes

Structural component wiring from specs 046 and 074. The session entity model,
URL hash rules, intent resolution, protocol support, and execution logic from
those specs remain valid.

## Component tree

```
/session +page.svelte
└─ <Session bind:session>
   ├─ header: editable name, <AccountsSelect>, Mainnet/Testnet toggle
   └─ <ActionsSequence bind:actions={session.actions}>
      └─ <EditableItemsList operations={[Add, Delete, Duplicate, Reorder]}>
         └─ {#each} <Action bind:action>
            ├─ <Select> for ActionType
            └─ three-column grid (Params | Protocol | Preview)
               └─ type-specific component
                  (BridgeAction, SwapAction, TransferAction, LiquidityAction)
```

## Data model changes

### SessionAction entity

Currently `Session.actions` is `SessionAction[]` (array
of type strings) with a single shared `params: Record<string, unknown>`. To
support per-action state and `bind:`, each element becomes an object:

```typescript
type SessionAction = {
  type: SessionAction
  params: Record<string, unknown>
}
```

`Session.actions` becomes `SessionAction[]`. The session-level
`params` field remains for backward compatibility and shared context; per-action
params take precedence.

### ItemsListOperation enum

```typescript
enum ItemsListOperation {
  Add = 'Add',
  Delete = 'Delete',
  Duplicate = 'Duplicate',
  Reorder = 'Reorder',
}
```

## New and changed components

### `EditableItemsList.svelte` (`src/components/`)

Wraps `<ItemsList>` with mutation capabilities, controlled by `operations` prop.

Props:
- `items: _Item[]` (bindable) — the mutable array
- `operations: ItemsListOperation[]` — which operations are enabled
- `getKey: (_Item) => _Key`
- `getSortValue: (_Item) => number | string`
- `createItem: () => _Item` — factory for Add and Duplicate (base)
- `duplicateItem?: (_Item) => _Item` — custom clone (defaults to structuredClone)
- `Item: Snippet<[{ item: _Item, index: number }]>` — item render snippet

Behavior:
- **Add**: appends `createItem()` result to array
- **Delete**: removes item at index
- **Duplicate**: inserts `duplicateItem(item)` after original
- **Reorder**: uses `lib/reorder` for drag-rearrange of array items
- Each item shows an operations toolbar with enabled operations only

### `Session.svelte` (`src/routes/session/`)

Replaces per-action wrappers (Bridge.svelte, Swap.svelte, Transfer.svelte,
Liquidity.svelte).

Props:
- `session: Session` (bindable)

Renders:
- Editable session name (`<input>` bound to `session.id` label or a name field)
- `<AccountsSelect>` (bind connected wallets, selected actor, selected chain)
- Mainnet/Testnet toggle (existing `bridgeSettingsState` toggle)
- `<ActionsSequence bind:actions={session.actions}>`

### `ActionsSequence.svelte` (`src/routes/session/`)

Props:
- `actions: SessionAction[]` (bindable)

Renders `<EditableItemsList>` with all four operations enabled, creating
`<Action>` for each array element.

### `Action.svelte` (`src/routes/session/`)

Props:
- `action: SessionAction` (bindable) — the action entry
- Session context via getContext or props: connected wallets, selected actor,
  isTestnet, selected chain ID

Renders:
- `<Select>` bound to `action.type` with `actionTypes` as options
- Three-column grid (`[data-grid="columns-autofit column-min-16 gap-6"]`):
  Params | Protocol | Preview
- Conditionally renders type-specific component based on `action.type`:
  - `Swap` → `<SwapAction bind:params={action.params}>`
  - `Bridge` → `<BridgeAction bind:params={action.params}>`
  - `Transfer` → `<TransferAction bind:params={action.params}>`
  - `AddLiquidity` / `RemoveLiquidity` / liquidity → `<LiquidityAction bind:params={action.params}>`
  - Other → placeholder with action label

### Type-specific action components (refactored)

Existing `BridgeAction.svelte`, `SwapAction.svelte`, `TransferAction.svelte`
are refactored to:
- Accept `params: Record<string, unknown>` (bindable) instead of managing their
  own session hash state
- Receive session context (wallets, actor, chain) via props or context
- Provide Params / Protocol / Preview column content via snippets or direct
  rendering
- Remove duplicated session bootstrap, hash management, and DB query logic
  (moved to `Session.svelte`)

New `LiquidityAction.svelte` consolidates `LiquidityFlow.svelte` in the same
pattern.

### Obsolete components (to remove)

| Component | Replaced by |
| --- | --- |
| `src/views/Session.svelte` | `src/routes/session/Session.svelte` |
| `src/views/SessionAction.svelte` | Three-column layout in `Action.svelte` |
| `src/routes/session/Bridge.svelte` | `Session.svelte` + `Action.svelte` |
| `src/routes/session/Swap.svelte` | `Session.svelte` + `Action.svelte` |
| `src/routes/session/Transfer.svelte` | `Session.svelte` + `Action.svelte` |
| `src/routes/session/Liquidity.svelte` | `Session.svelte` + `Action.svelte` |

Preserved (used by Action internals):
- `UnifiedProtocolRouter.svelte` — used by BridgeAction for protocol selection
- `SwapExecution.svelte` — used by SwapAction for execution
- `SwapFlow.svelte`, `TransferFlow.svelte`, `Positions.svelte` — used by
  refactored action components internally

## `bind:` strategy

```
+page.svelte → <Session bind:session>
Session      → <ActionsSequence bind:actions={session.actions}>
ActionsSequence → <Action bind:action={actions[i]}>
Action       → <SwapAction bind:params={action.params}> (etc.)
```

All mutations flow upward through `bind:`. Session persistence to TanStack DB
happens at the `Session` level via `$effect` that syncs the bound session object.

## Acceptance criteria

- [x] `ItemsListOperation` enum exists with `Add`, `Delete`, `Duplicate`,
  `Reorder` values.
- [x] `EditableItemsList` component exists in `src/components/` with
  `operations` prop controlling which operations are available per item.
- [x] `SessionAction` type defined with `type` and `params` fields;
  `Session.actions` uses it.
- [x] `Session.svelte` in `src/routes/session/` renders editable name,
  `<AccountsSelect>`, testnet toggle, and `<ActionsSequence>`.
- [x] `ActionsSequence` renders `<EditableItemsList>` of `<Action>` components
  bound to `session.actions`.
- [x] `Action` renders `<Select>` for `ActionType` and the three-column flow
  grid.
- [x] Changing action type via `<Select>` updates the bound action entry.
- [x] Type-specific components (BridgeAction, SwapAction, TransferAction,
  LiquidityAction) render their column content and bind to `action.params`.
- [x] Reorder via `lib/reorder` rearranges `session.actions` array order.
- [x] Add / Delete / Duplicate operations modify `session.actions` correctly.
- [x] Existing bridge, swap, transfer, liquidity functionality is preserved
  (quotes, execution, simulation, protocol selection).
- [x] Obsolete wrapper components are removed.
- [x] URL hash session bootstrap and navigation still works.
- Spec 101 updates the session URL model (template/session params, persist on
  first edit).

## Status

Complete. 2026-02-07 (PROMPT_build execute one spec): All 14 AC—ItemsListOperation in EditableItemsList.svelte; EditableItemsList with operations; SessionAction in Session.ts, Session.actions; Session.svelte with name, AccountsSelect, testnet toggle (Switch), ActionsSequence; ActionsSequence with EditableItemsList of Action; Action with Select and data-grid three-column; type change updates action; BridgeAction/SwapAction/TransferAction/LiquidityAction bind:params, inline three-column (SessionAction removed); EditableItemsList reorder (drag); Add/Delete/Duplicate in EditableItemsList; bridge/swap/transfer/liquidity preserved; views/Session.svelte and views/SessionAction.svelte removed, view/bridge uses routes/session/Session; URL hash bootstrap unchanged in +page.svelte. Build and Vitest (159) passed.
