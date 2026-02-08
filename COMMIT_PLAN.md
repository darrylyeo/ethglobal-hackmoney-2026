# Atomic commit plan

## Phase 1: Docs and tooling

| # | Commit message | Files |
|---|----------------|--------|
| 1 | specs: add 075 format, 076 import extensions, 077 declarative intents | specs/075-format-command.md, specs/076-import-path-extensions.md, specs/077-declarative-intents-and-actions.md |
| 2 | cursor rules: add spec refs, fix format globs | .cursor/rules/format.mdc, .cursor/rules/import-extensions.mdc |

## Phase 2: Data and session types

| # | Commit message | Files |
|---|----------------|--------|
| 3 | data: add ActorNetwork entity type | src/data/$EntityType.ts |
| 4 | data: add session actions createChannel, addChannelMember, closeChannel, addLiquidity, removeLiquidity | src/data/Session.ts |
| 5 | session: parse and normalize new session hash actions | src/lib/session/params.ts, src/lib/session/sessions.ts |

## Phase 3: Declarative intents (topological)

| # | Commit message | Files |
|---|----------------|--------|
| 6 | intents: declarative model (ActionType, Protocol, IntentOption, intents) | src/constants/intents.ts |
| 7 | intents: add lib/intents.ts and resolve.spec | src/lib/intents.ts, src/lib/intents/resolve.spec.ts |
| 8 | intentDraggable: use intentEntityTypes from lib/intents | src/lib/intents/intentDraggable.svelte.ts |
| 9 | IntentDragPreview: use resolveIntentForDrag and IntentOption | src/components/IntentDragPreview.svelte |
| 9b | intents: remove registry, resolveIntent, routes | D src/lib/intents/registry.ts, D src/lib/intents/resolveIntent.ts, D src/lib/intents/routes.ts |

## Phase 4: Routes and layout

| # | Commit message | Files |
|---|----------------|--------|
| 10 | layout: session nav addLiquidity, removeLiquidity, createChannel, closeChannel; move asset imports | src/routes/+layout.svelte |
| 11 | session: wire new hash branches in session page | src/routes/session/+page.svelte |
| 12 | routes: +page and test intents page use new intents | src/routes/+page.svelte, src/routes/test/intents/+page.svelte |

(Execute 9b after 12 so no file imports deleted modules.)

## Phase 5: E2E

| # | Commit message | Files |
|---|----------------|--------|
| 13 | e2e: coverage manifest and intents-drag tests for declarative intents | e2e/coverage-manifest.ts, e2e/intents-drag.test.ts |
| 14 | e2e: add navigation and session-actions tests | e2e/navigation.test.ts, e2e/session-actions.test.ts |

## Phase 6: Intent audit – payload renames, new actions, new intents

| # | Commit message | Files | Depends on |
|---|----------------|--------|------------|
| 15 | intents: rename payload fields fromActor/toActor/coin → fromActorCoin/toActorCoin | src/constants/intents.ts | 6 |
| 16 | intents: add ActionType, Protocol enums, payload types, and protocolActions | src/constants/intents.ts | 15 |
| 17 | data: add session action types for new actions | src/data/Session.ts | 4 |
| 18 | session: recognize new action types in hash parser | src/lib/session/sessions.ts | 17 |
| 19 | intents: add SendFunds, SwapToCoin, ManagePosition, and room/peer intents | src/constants/intents.ts | 16 |
| 20 | IntentDragPreview: map all ActionType values to session actions | src/components/IntentDragPreview.svelte | 16, 17 |
| 21 | intents: update resolve.spec for new intents and protocol mappings | src/lib/intents/resolve.spec.ts | 19 |
| 22 | e2e: update intents-drag test for 11 registered intents | e2e/intents-drag.test.ts | 19 |

---

Phase 6 completed SHAs:

| # | SHA | Message |
|---|-----|---------|
| 15 | 18bff15 | intents: rename payload fields fromActor/toActor/coin → fromActorCoin/toActorCoin |
| 16 | 59abfa4 | intents: add ActionType, Protocol enums, payload types, and protocolActions |
| 17 | a8a4f6d | data: add session action types for new actions |
| 18 | 1a834d5 | session: recognize new action types in hash parser |
| 19 | 16aec54 | intents: add SendFunds, SwapToCoin, ManagePosition, and room/peer intents |
| 20 | 642a2f4 | IntentDragPreview: map all ActionType values to session actions |
| 21 | 027a55f | intents: update resolve.spec for new intents and protocol mappings |
| 22 | 45ba709 | e2e: update intents-drag test for 11 registered intents |

---

## Completed (SHAs)

| # | SHA | Message |
|---|-----|---------|
| 1 | cb62d48 | specs: add 075 format, 076 import extensions, 077 declarative intents |
| 2 | adcc2f0 | cursor rules: add spec refs, fix format globs |
| 3 | 3bb3bb7 | data: add ActorNetwork entity type |
| 4 | 88d5bcf | data: add session actions createChannel, addChannelMember, closeChannel, addLiquidity, removeLiquidity |
| 5 | 8be2bee | session: parse and normalize new session hash actions |
| 6 | 63d3156 | intents: declarative model (ActionType, Protocol, IntentOption, intents) |
| 7 | 774c84e | intents: add lib/intents.ts and resolve.spec |
| 8 | fecf360 | intentDraggable: use intentEntityTypes from lib/intents |
| 9 | d49d038 | IntentDragPreview: use resolveIntentForDrag and IntentOption |
| 10 | 9070e5f | layout: session nav addLiquidity, removeLiquidity, createChannel, closeChannel; move asset imports |
| 11 | 677a0a0 | session: wire new hash branches in session page |
| 12 | 4ff8857 | routes: +page and test intents page use new intents |
| 9b | d87cda4 | intents: remove registry, resolveIntent, routes |
| 13 | 3458d8a | e2e: coverage manifest and intents-drag tests for declarative intents |
| 14 | 1498994 | e2e: add navigation and session-actions tests |

## Commit later / ignore

- COMMIT_PLAN.md (this file)
- specs/058-graphscene-local-query-stacks.md
- src/components/LocalGraphScene.svelte
- src/routes/GraphScene.svelte
- src/routes/+layout.svelte
- src/routes/+page.svelte
- src/routes/account/[address]/+page.svelte
- src/routes/rooms/[roomId]/+page.svelte
- src/routes/session/+page.svelte
- src/routes/sessions/+page.svelte
- src/svelte/live-query-context.svelte.ts
- e2e/coverage-manifest.ts
- e2e/navigation.test.ts
- e2e/session-actions.test.ts
- src/lib/session/params.ts
