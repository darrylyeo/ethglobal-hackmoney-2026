# Spec 066: Dialogue tree data model and collections

Define the data model and TanStack DB collections for tree-structured LLM
conversations ("dialogue trees"). Each tree is a rooted DAG of prompt-response
pairs ("dialogue turns") with optional entity references. The generic
`LlmProvider` abstraction from spec 051 (Part 1) is the generation backend.
Port the "explain transaction" feature to write dialogue turns instead of
ephemeral component state.

## Naming rationale

"Turn" is established terminology (Open Assistant, Graphlit) for a
prompt-response pair. "Dialogue" distinguishes from the existing
`TransactionSession` concept while staying domain-neutral. Fits the codebase's
singular-noun naming convention (`Block`, `Transaction`, `Room`).

## Scope

- Data types: `DialogueTree`, `DialogueTurn`, `EntityRef`.
- TanStack DB collections: `dialogueTreesCollection`, `dialogueTurnsCollection`.
- `EntityType` enum additions.
- `DataSource.Llm` addition.
- `buildDialogueMessages` helper for context assembly.
- Port "explain transaction" to write `DialogueTurn` nodes.

## Non-goals

- No UI components or routes (see spec 067).
- No streaming; generation is request-response.
- No multi-model orchestration or agent planning.

## Data types

### `DialogueTurn` (`src/data/DialogueTurn.ts`)

```ts
type DialogueTurnStatus =
	| 'pending'
	| 'generating'
	| 'complete'
	| 'error'
	| 'cancelled'

type DialogueTurn = {
	id: string
	treeId: string
	parentId: string | null
	userPrompt: string
	entityRefs: EntityRef[]
	assistantText: string | null
	providerId: string | null
	providerConfig?: { model?: string }
	status: DialogueTurnStatus
	error?: string
	createdAt: number
	promptVersion: string
}
```

- `id` — UUID.
- `treeId` — FK to `DialogueTree`.
- `parentId` — FK to parent `DialogueTurn`; `null` for root turns.
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

### `DialogueTree` (`src/data/DialogueTree.ts`)

```ts
type DialogueTree = {
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

```ts
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

### `dialogueTreesCollection` (`src/collections/dialogue-trees.ts`)

- `localStorageCollectionOptions`
- `id: 'dialogue-trees'`
- `storageKey: 'dialogue-trees'`
- `getKey: (row) => row.id`
- `parser: { stringify, parse }` from `devalue`

### `dialogueTurnsCollection` (`src/collections/dialogue-turns.ts`)

- `localStorageCollectionOptions`
- `id: 'dialogue-turns'`
- `storageKey: 'dialogue-turns'`
- `getKey: (row) => row.id`
- `parser: { stringify, parse }` from `devalue`

## EntityType additions

Add to `src/data/$EntityType.ts`:

```ts
DialogueTree = 'DialogueTree',
DialogueTurn = 'DialogueTurn',
```

With metadata entries:

```ts
{ type: EntityType.DialogueTree, label: 'Dialogue', labelPlural: 'Dialogues', inGraph: false },
{ type: EntityType.DialogueTurn, label: 'Turn', labelPlural: 'Turns', inGraph: false },
```

## DataSource addition

Add `Llm = 'Llm'` to `src/constants/data-sources.ts`. Used as `$source` for
rows produced by LLM generation.

## LLM harness integration

### `buildDialogueMessages` (`src/lib/dialogue.ts`)

```ts
const buildDialogueMessages = (
	turns: DialogueTurn[],
	turn: DialogueTurn,
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

### `submitDialogueTurn` (`src/lib/dialogue.ts`)

Convenience function that:

1. Inserts a new `DialogueTurn` into `dialogueTurnsCollection` with
   `status: 'generating'`.
2. Calls `buildDialogueMessages(allTurns, newTurn, tree.systemPrompt)`.
3. Calls `createLlmProvider().generate(messages)`.
4. On success: updates the turn with `assistantText`, `providerId`,
   `status: 'complete'`.
5. On error: updates the turn with `error`, `status: 'error'`.
6. Updates `tree.updatedAt`.
7. Returns the turn `id`.

### `retryDialogueTurn` (`src/lib/dialogue.ts`)

When a turn has `status === 'error'`, the UI can call:

```ts
retryDialogueTurn(options: {
	turnId: string
	allTurns: DialogueTurn[]
	systemPrompt: string
	onProgress?: (progress: number) => void
})
```

Behavior: no-op if the turn is missing or not in `'error'` status. Otherwise
sets the turn to `status: 'generating'` and clears `error`, then runs the same
flow as `submitDialogueTurn` (build messages from ancestors, call
`LlmProvider.generate()`, update turn on success or error, update
`tree.updatedAt`). Used by the Retry button in `DialogueTurnNode`.

### Delete helpers (`src/lib/dialogue.ts`)

- **`collectDialogueTurnDescendantIds(turnId, allTurns)`** — Returns a `Set<string>` of `turnId` and all descendant turn ids (BFS via `parentId`).
- **`deleteDialogueTurn(turnId, allTurns)`** — Calls `dialogueTurnsCollection.delete(id)` for the turn and every descendant (from `collectDialogueTurnDescendantIds`). Used by the UI to remove a branch.

## Porting "explain transaction"

The existing `createExplainProvider` / `explainTransaction` flow stores results
in ephemeral component state (`txOverrides` in `TransactionFlow.svelte`). Port
to write `DialogueTurn` nodes:

- When user clicks "Explain results," create a `DialogueTree` (or reuse one
  per `TransactionSession`) with `systemPrompt` set to `EXPLAIN_SYSTEM_PROMPT`
  and insert a root `DialogueTurn` with:
  - `userPrompt` built from `buildExplainUserPrompt(context)`.
  - `entityRefs` pointing to the transaction / simulation entity.
- On completion, update the turn's `assistantText`, `providerId`, `status`.
- `TransactionFlow.svelte` reads the turn from `dialogueTurnsCollection` via
  live query instead of component state. Existing UI (button, loading, cancel,
  result display) stays the same; only the storage layer changes.
- `ExplainRecord` type is retired; `DialogueTurn` subsumes it (`createdAt`,
  `promptVersion`, `providerId`, `assistantText`).
- `ExplainAvailability`, `ExplainContext`, `ExplainInput`, `ExplainOutput`,
  `ExplainProvider`, `createExplainProvider`, `buildExplainUserPrompt` remain
  in `src/lib/explain.ts` as the feature-specific layer that wraps
  `LlmProvider` and builds domain prompts. The only change is that the result
  is persisted as a `DialogueTurn` instead of returned as an `ExplainRecord`.

## Acceptance criteria

- [x] `DialogueTree` and `DialogueTurn` data types defined in `src/data/`.
- [x] `EntityRef` type defined in `src/data/EntityRef.ts`.
- [x] `dialogueTreesCollection` and `dialogueTurnsCollection` created with
  localStorage persistence in `src/collections/`.
- [x] `EntityType.DialogueTree` and `EntityType.DialogueTurn` added to
  `$EntityType.ts`.
- [x] `DataSource.Llm` added to `src/constants/data-sources.ts`.
- [x] `buildDialogueMessages` helper walks the parent chain (entity ref
  resolution inline is optional; current impl uses prompts as-is).
- [x] `submitDialogueTurn` helper inserts a turn, calls `LlmProvider`, and
  updates the turn on completion/error.
- [x] "Explain transaction" writes `DialogueTurn` nodes instead of ephemeral
  state; existing UI unchanged.
- [x] `ExplainRecord` type retired; explain reads from
  `dialogueTurnsCollection`.
- [x] `collectDialogueTurnDescendantIds` and `deleteDialogueTurn` implemented
  for cascade delete.
- [x] `retryDialogueTurn` implemented for re-running generation on failed turns.

## Sources

- Open Assistant data schema: `ConversationTree` / `ConversationTreeNode`
  (tree_id, parent_id, message_id, role)
- Graphlit conversation API: turns with USER/ASSISTANT roles
- Spec 051 Part 1: `LlmProvider` abstraction

## Status

Complete. Explain flow ported to DialogueTurn in `explain.ts`; TransactionFlow
reads from `dialogueTurnsCollection`. Optional: resolve entity refs to cached
summaries inside `buildDialogueMessages`.

## Output when complete

`DONE`
