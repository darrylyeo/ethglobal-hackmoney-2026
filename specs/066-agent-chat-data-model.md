# Spec 066: Agent chat data model and collections

Define the data model and TanStack DB collections for tree-structured LLM
conversations ("agent chat trees"). Each tree is a rooted DAG of prompt-response
pairs ("agent chat turns") with optional entity references. The generic
`LlmProvider` abstraction from spec 051 (Part 1) is the generation backend.
Port the "explain transaction" feature to write agent chat turns instead of
ephemeral component state.

## Naming rationale

"Turn" is established terminology (Open Assistant, Graphlit) for a
prompt-response pair. "Agent chat" distinguishes from the existing
`Session` concept while staying domain-neutral. Fits the codebase's
singular-noun naming convention (`Block`, `Transaction`, `Room`).

## Scope

- Data types: `AgentChatTree`, `AgentChatTurn`, `EntityRef`.
- TanStack DB collections: `agentChatTreesCollection`, `agentChatTurnsCollection`.
- `EntityType` enum additions.
- `DataSource.Llm` addition.
- `buildAgentChatMessages` helper for context assembly.
- Port "explain transaction" to write `AgentChatTurn` nodes.

## Non-goals

- No UI components or routes (see spec 067).
- No streaming; generation is request-response.
- No multi-model orchestration or agent planning.

## Data types

### `AgentChatTurn` (`src/data/AgentChatTurn.ts`)

```typescript
type AgentChatTurnStatus =
	| 'pending'
	| 'generating'
	| 'complete'
	| 'error'
	| 'cancelled'

type AgentChatTurn = {
	id: string
	treeId: string
	parentId: string | null
	userPrompt: string
	entityRefs: EntityRef[]
	assistantText: string | null
	providerId: string | null
	providerConfig?: { model?: string }
	status: AgentChatTurnStatus
	error?: string
	createdAt: number
	promptVersion: string
}
```

- `id` — UUID.
- `treeId` — FK to `AgentChatTree`.
- `parentId` — FK to parent `AgentChatTurn`; `null` for root turns.
- `userPrompt` — the user's prompt text (may contain entity references as
  `@EntityType:key` tokens).
- `entityRefs` — parsed entity references extracted from `userPrompt`.
- `assistantText` — LLM response; `null` while generating.
- `providerId` — which `LlmProvider` produced the response (e.g.
  `'prompt-api'`, `'hosted'`).
- `providerConfig` — optional per-turn override (e.g. model name).
- `status` — lifecycle state.
- `error` — error message when `status === 'error'`.
- `createdAt` — epoch ms.
- `promptVersion` — version string of the system prompt template used.

### `AgentChatTree` (`src/data/AgentChatTree.ts`)

```typescript
type AgentChatTree = {
	id: string
	name: string | null
	pinned: boolean
	systemPrompt: string
	createdAt: number
	updatedAt: number
}
```

- `id` — UUID (same value used as `treeId` on root turns).
- `name` — user-assigned name; auto-generated from first prompt when `null`.
- `pinned` — whether it appears in the nav under "Agents".
- `systemPrompt` — system prompt for all turns in this tree (default from a
  constant, overridable per tree).
- `createdAt` / `updatedAt` — epoch ms.

### `EntityRef` (`src/data/EntityRef.ts`)

```typescript
type EntityRef = {
	entityType: EntityType
	entityId: string
	displayLabel: string
}
```

- `entityType` — from the existing `EntityType` enum in `$EntityType.ts`.
- `entityId` — serialized entity key (e.g. `'1:0xabc...'` for a chain
  transaction on chain 1).
- `displayLabel` — what was shown in the prompt input (e.g. `@0xabc...`).

## Collections

### `agentChatTreesCollection` (`src/collections/AgentChatTrees.ts`)

- `localStorageCollectionOptions`
- `id: CollectionId.AgentChatTrees` (`'AgentChatTrees'`)
- `storageKey: CollectionId.AgentChatTrees`
- `getKey: (row) => row.id`
- `parser: { stringify, parse }` from `devalue`

### `agentChatTurnsCollection` (`src/collections/AgentChatTurns.ts`)

- `localStorageCollectionOptions`
- `id: CollectionId.AgentChatTurns` (`'AgentChatTurns'`)
- `storageKey: CollectionId.AgentChatTurns`
- `getKey: (row) => row.id`
- `parser: { stringify, parse }` from `devalue`

## EntityType additions

Add to `src/data/$EntityType.ts`:

```typescript
AgentChatTree = 'AgentChatTree',
AgentChatTurn = 'AgentChatTurn',
```

With metadata entries:

```typescript
{ type: EntityType.AgentChatTree, label: 'Agent chat', labelPlural: 'Agent chats', inGraph: false },
{ type: EntityType.AgentChatTurn, label: 'Turn', labelPlural: 'Turns', inGraph: false },
```

## DataSource addition

Add `Llm = 'Llm'` to `src/constants/data-sources.ts`. Used as `$source` for
rows produced by LLM generation.

## LLM harness integration

### `buildAgentChatMessages` (`src/lib/agentChat.ts`)

```typescript
const buildAgentChatMessages = (
	turns: AgentChatTurn[],
	turn: AgentChatTurn,
	systemPrompt: string,
): LlmGenerateInput => ...
```

Walks the `parentId` chain from `turn` back to the root, collecting ancestors
in order. Concatenates each ancestor's `userPrompt` and `assistantText` into a
single `userPrompt` string (multi-turn context flattened for the one-shot
`LlmProvider.generate()` interface). The current turn's `userPrompt` is
appended last.

Entity references within prompts are resolved inline: if the referenced entity
is cached in its TanStack DB collection, include a short summary; otherwise
include the `displayLabel` verbatim.

Returns `{ systemPrompt, userPrompt }` ready for `LlmProvider.generate()`.

### `submitAgentChatTurn` (`src/lib/agentChat.ts`)

Convenience function that:

1. Inserts a new `AgentChatTurn` into `agentChatTurnsCollection` with
   `status: 'generating'`.
2. Calls `buildAgentChatMessages(allTurns, newTurn, tree.systemPrompt)`.
3. Calls `createLlmProvider().generate(messages)`.
4. On success: updates the turn with `assistantText`, `providerId`,
   `status: 'complete'`.
5. On error: updates the turn with `error`, `status: 'error'`.
6. Updates `tree.updatedAt`.
7. Returns the turn `id`.

### `retryAgentChatTurn` (`src/lib/agentChat.ts`)

When a turn has `status === 'error'`, the UI can call:

```typescript
retryAgentChatTurn(options: {
	turnId: string
	allTurns: AgentChatTurn[]
	systemPrompt: string
	onProgress?: (progress: number) => void
})
```

Behavior: no-op if the turn is missing or not in `'error'` status. Otherwise
sets the turn to `status: 'generating'` and clears `error`, then runs the same
flow as `submitAgentChatTurn` (build messages from ancestors, call
`LlmProvider.generate()`, update turn on success or error, update
`tree.updatedAt`). Used by the Retry button in `AgentChatTurnNode`.

### Delete helpers (`src/lib/agentChat.ts`)

- **`collectAgentChatTurnDescendantIds(turnId, allTurns)`** — Returns a `Set<string>` of `turnId` and all descendant turn ids (BFS via `parentId`).
- **`deleteAgentChatTurn(turnId, allTurns)`** — Calls `agentChatTurnsCollection.delete(id)` for the turn and every descendant (from `collectAgentChatTurnDescendantIds`). Used by the UI to remove a branch.

## Porting "explain transaction"

The existing `createExplainProvider` / `explainTransaction` flow stores results
in ephemeral component state (`txOverrides` in `TransactionFlow.svelte`). Port
to write `AgentChatTurn` nodes:

- When user clicks "Explain results," create an `AgentChatTree` (or reuse one
  per `Session`) with `systemPrompt` set to `EXPLAIN_SYSTEM_PROMPT`
  and insert a root `AgentChatTurn` with:
  - `userPrompt` built from `buildExplainUserPrompt(context)`.
  - `entityRefs` pointing to the transaction / simulation entity.
- On completion, update the turn's `assistantText`, `providerId`, `status`.
- `TransactionFlow.svelte` reads the turn from `agentChatTurnsCollection` via
  live query instead of component state. Existing UI (button, loading, cancel,
  result display) stays the same; only the storage layer changes.
- `ExplainRecord` type is retired; `AgentChatTurn` subsumes it (`createdAt`,
  `promptVersion`, `providerId`, `assistantText`).
- `ExplainAvailability`, `ExplainContext`, `ExplainInput`, `ExplainOutput`,
  `ExplainProvider`, `createExplainProvider`, `buildExplainUserPrompt` remain
  in `src/lib/llmProvider.ts` as the feature-specific layer that wraps
  `LlmProvider` and builds domain prompts. The only change is that the result
  is persisted as an `AgentChatTurn` instead of returned as an `ExplainRecord`.

## Acceptance criteria

- [x] `AgentChatTree` and `AgentChatTurn` data types defined in `src/data/`.
- [x] `EntityRef` type defined in `src/data/EntityRef.ts`.
- [x] `agentChatTreesCollection` and `agentChatTurnsCollection` created with
  localStorage persistence in `src/collections/`.
- [x] `EntityType.AgentChatTree` and `EntityType.AgentChatTurn` added to
  `$EntityType.ts`.
- [x] `DataSource.Llm` added to `src/constants/data-sources.ts`.
- [x] `buildAgentChatMessages` helper walks the parent chain (entity ref
  resolution inline is optional; current impl uses prompts as-is).
- [x] `submitAgentChatTurn` helper inserts a turn, calls `LlmProvider`, and
  updates the turn on completion/error.
- [x] "Explain transaction" writes `AgentChatTurn` nodes instead of ephemeral
  state; existing UI unchanged.
- [x] `ExplainRecord` type retired; explain reads from
  `agentChatTurnsCollection`.
- [x] `collectAgentChatTurnDescendantIds` and `deleteAgentChatTurn` implemented
  for cascade delete.
- [x] `retryAgentChatTurn` implemented for re-running generation on failed turns.

## Sources

- Open Assistant data schema: `ConversationTree` / `ConversationTreeNode`
  (tree_id, parent_id, message_id, role)
- Graphlit conversation API: turns with USER/ASSISTANT roles
- Spec 051 Part 1: `LlmProvider` abstraction

## Status

Complete. Explain flow ported to AgentChatTurn in `llmProvider.ts`; TransactionFlow
reads from `agentChatTurnsCollection`. Optional: resolve entity refs to cached
summaries inside `buildAgentChatMessages`.

## Output when complete

`DONE`
