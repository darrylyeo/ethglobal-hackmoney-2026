# Spec 067: Agent session UI and routes

Implement the agent session UI: entity-referencing prompt input (contenteditable
with nested @-combobox), agent chat tree and turn node components, `<Tabs>` when
multiple children or Reply, routes for listing and viewing agent chat trees, and
nav integration for pinned trees. Built on the data model from spec 066 and the
`LlmProvider` abstraction from spec 051.

## Scope

- `EntityRefPattern` enum and config for pattern matching entity references.
- `<EntityRefInput>` component with `@`-triggered inline combobox.
- `<AgentChatTree>` and `<AgentChatTurnNode>` components (colocated in
  `src/routes/agents/[nodeId]/`).
- When a turn has more than one “item” (child nodes or the Reply input when
  shown), use the `<Tabs>` component (one tab per child + optional Reply tab).
- `/agents`, `/agents/new`, and `/agents/[nodeId]` routes.
- Navigation integration: “New conversation” + pinned trees under Agents.
- Hash-based targeting: `#turn:{turnId}` drives which node shows the prompt
  form and receives autofocus; no redirect on submit (stay on path, set hash).
- Delete turn (and all descendants); pin/unpin from list and tree view.

## Non-goals

- No agent planning, tool use, or multi-step orchestration.
- No streaming responses.
- No drag-and-drop or reordering of turns.

## Entity reference input

### `EntityRefPattern` (`src/constants/entity-ref-patterns.ts`)

```typescript
enum EntityRefPattern {
	EvmAddress = 'EvmAddress',
	EvmBlockNumber = 'EvmBlockNumber',
	EvmTransactionHash = 'EvmTransactionHash',
	EntityId = 'EntityId',
}
```

Each pattern has:

```typescript
type EntityRefPatternConfig = {
	label: string
	placeholder: string
	pattern: RegExp
	matchComplexity: number
	isHumanReadable: boolean
}
```

`entityRefPatternsConfig` — config object:

- `EvmAddress`: label `'Address'`, pattern `^0x[0-9a-fA-F]{40}$`,
  complexity 2.
- `EvmBlockNumber`: label `'Block Number'`, pattern `^\d+$`, complexity 1.
- `EvmTransactionHash`: label `'Transaction Hash'`,
  pattern `^0x[0-9a-fA-F]{64}$`, complexity 3.
- `EntityId`: label `'Entity'`, pattern `^[A-Z][a-zA-Z]+:\S+$` (matches
  `EntityType:key` syntax like `Block:1:12345`), complexity 2.

### `EntityRefInput.svelte` (`src/components/EntityRefInput.svelte`)

Prompt box is a **contenteditable** div with the `@` entity-ref combobox nested
within the same wrapper (mirror for caret measurement + dropdown list). Per MDN:
use `contenteditable="plaintext-only"` to lock down formatting, plus
`enterkeyhint="send"`, `inputmode="text"`; paste inserts plain text only
(`insertText` in paste handler). Caret/selection use the Selection API
(`getCaretCharacterOffsetWithin`, `setCaretToPosition`).

Props:

- `value: string` (bindable) — raw input text (synced to/from contenteditable
  `innerText`).
- `entityRefs: EntityRef[]` (bindable) — parsed references.
- `placeholder?: string` — shown via `data-placeholder` and `:empty:not(:focus)::before`.
- `suggestions?: { value: string, label: string, group?: string }[]` —
  suggestions shown when `@` is typed; filtered by text after `@`.
- `disabled?: boolean` — sets `contenteditable="false"` when true.
- `autofocus?: boolean` — when true, focus the editor (e.g. when this turn is
  the hash target after navigation).
- `onsubmit?: (value: string, entityRefs: EntityRef[]) => void`

Behavior:

- When the user types `@` (with no space between `@` and cursor), show the
  dropdown at the caret (mirror element with same font/padding as the
  contenteditable). Filter `suggestions` by the query after `@` (match on
  `value` or `label`, case-insensitive).
- If there are no suggestions (or none match), show hint: “Type an address
  (0x…), block number, or tx hash”.
- Keyboard: Arrow Up/Down to highlight, Enter to select, Escape to close.
  **Delete or Backspace when the combobox is open and the query is empty**
  closes the dropdown and leaves a regular `@` in the text (no insertion).
  Click to select. On select, insert `@` + suggestion `value` at the `@`
  position and close the dropdown.
- On submit (Enter or button), parse all `@`-prefixed tokens in `value` into
  `EntityRef[]` (via `EntityRefPattern` regexes) and call `onsubmit`.

## Components

### `Tabs.svelte` (`src/components/Tabs.svelte`)

Encapsulates the full bits-ui Tabs structure so consumers do not use bits-ui
Tabs directly. Renders `Tabs.Root`, `Tabs.List`, one `Tabs.Trigger` per tab,
and one `Tabs.Content` per tab with the same `data-tabs-*` attributes for
`src/styles/bits-ui.css`.

Props:

- `tabs: Tab[]` where `Tab extends { id: string, label: string }` (generic so
  items can carry extra fields, e.g. `type: 'reply' | 'child'`, `child`).
- `value: string` (bindable) — active tab id.
- `content: Snippet<[Tab]>` — snippet invoked per tab to render panel content.
- Additional props are forwarded to `Tabs.Root`.

Consumers use `<Tabs tabs={tabItems} bind:value={activeTab}>` with
`{#snippet content(item)} ... {/snippet}`. No bits-ui Tabs imports in app code.

### `AgentChatTree.svelte` (`src/routes/agents/[nodeId]/AgentChatTree.svelte`)

Props:

- `tree: AgentChatTree`
- `turns: AgentChatTurn[]` — all turns in this tree.
- `connections?: LlmConnectionRow[]` — for default model selector.

Behavior:

- Shows tree name (editable inline), “New conversation” button, and pin
  toggle (bits-ui `Button.Root`).
- Optional default model selector (`<ModelInput>`) when connections exist.
- System prompt in a collapsible `<details>`.
- Derives root turn (`parentId === null`) and renders root
  `<AgentChatTurnNode>`.
- ID: `agent-chat:{tree.id}` for anchor linking.

### `AgentChatTurnNode.svelte` (`src/routes/agents/[nodeId]/AgentChatTurnNode.svelte`)

Props:

- `turn: AgentChatTurn`
- `allTurns: AgentChatTurn[]` — all turns in the tree (for deriving children).
- `tree: AgentChatTree` — for system prompt and tree metadata.
- `connections?: LlmConnectionRow[]` — for per-reply model selector.

Behavior:

- **Card** (section with class `turn-card`): user prompt, Delete button,
  assistant response or status (generating / error / cancelled). When
  `status === 'error'`, show error message and a **Retry** button that calls
  `retryAgentChatTurn({ turnId, allTurns, systemPrompt: tree.systemPrompt })`.
- **Reply form**: Disabled when `turn.status === 'error'` (user must Retry
  first).
- **Reply link**: When the prompt form is not shown and turn is complete/error,
  first child of the card is an `<a href="#turn:{turn.id}">` with
  `position: absolute; inset: 0` and `<span class="sr-only">Reply</span>` so
  the whole card is clickable to target this turn.
- **Children + Reply**: Derive children as `allTurns.filter(t =>
  t.parentId === turn.id)`. Build `tabItems`: one entry per child (id, label
  from first 30 chars of `userPrompt` or “Branch N”) and, if the prompt form
  is visible, a “Reply” item. If `tabItems.length > 1`, render `<Tabs>`
  with `tabs={tabItems}`, `bind:value={activeTab}`, and a `content(item)`
  snippet that branches on `item.type` ('reply' → `<EntityRefInput>`, 'child'
  → `<AgentChatTurnNode>`). Active tab is synced from URL hash
  (`#turn:{turn.id}` → Reply, `#turn:{childId}` → that child). If only one
  item, render that item directly (no Tabs).
- **Prompt form**: Shown only when (turn complete or error) and (this node is
  the hash target `#turn:{turn.id}` or the form is dirty). When shown,
  optional `<ModelInput>` when connections exist, then
  `<EntityRefInput>` with `autofocus={isTarget}` and `disabled={turn.status === 'error'}`.
- **On submit**: Call `submitAgentChatTurn` with `parentId` set to this turn
  (and optional `connectionId`/`modelId` from ModelInput); then
  `goto(\`${pathname}#turn:${newTurnId}\`, { replaceState: true })` — no
  path change, only hash update so the new turn is targeted and its form
  appears with focus.
- **Delete**: Button calls `deleteAgentChatTurn(turn.id, allTurns)` (deletes
  turn and all descendants). If the current hash was one of the deleted ids,
  navigate to parent turn hash or pathname.
- ID: `turn:{turn.id}` for anchor linking.
- When not using Tabs, child nodes are wrapped with `animate:flip` (duration
  250, easing expoOut).

## Routes

### `/agents` (`src/routes/agents/+page.svelte`)

- Live query all `AgentChatTree` rows from `agentChatTreesCollection`, sorted
  by `updatedAt` desc.
- List: each row is a link to `/agents/{tree.id}` plus a Pin/Unpin button
  (bits-ui `Button.Root`); display tree name (or “Untitled”), updated date,
  pinned badge.
- “New conversation” button links to `/agents/new`.

### `/agents/new` (`src/routes/agents/new/+page.svelte`)

- On load: create a new `AgentChatTree` (default `systemPrompt`, `pinned:
  false`, `name: null`), then `goto(\`/agents/${tree.id}\`, { replaceState:
  true })` so the user lands on the new tree (no turns yet; page shows first
  prompt input).

### `/agents/[nodeId]` (`src/routes/agents/[nodeId]/+page.svelte`)

- `nodeId` is a `AgentChatTurn.id` or a `AgentChatTree.id`.
- Resolve tree: if `nodeId` matches a tree ID, use it; else if it matches a
  turn ID, use that turn’s `treeId`. Load tree and all turns for that tree.
- Render `<AgentChatTree tree turns connections={llmConnections}>`. No `focusTurnId`; which turn is
  “targeted” is determined by the URL hash `#turn:{turnId}`. The turn with
  matching id shows its prompt form (when complete/error) and receives
  autofocus.
- First prompt (no turns yet): on submit, create root turn then
  `goto(\`/agents/${tree.id}#turn:${turnId}\`, { replaceState: true })`.

### `/agents/[nodeId]`

Params available via `$page.params.nodeId` (optional `+page.ts` load may pass
`nodeId` through).

## Navigation integration

In `src/routes/+layout.svelte`, add an “Agents” section to `navigationItems`
after “Sessions”:

```typescript
{
	id: 'agents',
	title: 'Agents',
	href: '/agents',
	children: [
		{ id: 'agents-new', title: 'New conversation', href: '/agents/new' },
		...pinnedAgentChatTrees.map((tree) => ({
			id: `agent-${tree.id}`,
			title: tree.name ?? 'Untitled',
			href: `/agents/${tree.id}`,
		})),
	],
}
```

`pinnedAgentChatTrees`: live query on `agentChatTreesCollection` with `pinned ===
true`, sorted by `updatedAt` desc.

## Prompt submission flow

1. User types in `<EntityRefInput>`, optionally referencing entities with `@`.
2. On submit:
   a. Parse `@` tokens into `EntityRef[]` (via `EntityRefPattern` regexes).
   b. Call `submitAgentChatTurn` (from spec 066) with `parentId` set to the
      current turn (or `null` if creating root), `userPrompt`, `entityRefs`.
3. `submitAgentChatTurn` inserts an `AgentChatTurn` with `status: 'generating'`,
   builds context via `buildAgentChatMessages`, calls `LlmProvider.generate()`,
   and updates the turn.
4. Update URL only by hash: `goto(\`${pathname}#turn:${newTurnId}\`, {
   replaceState: true })` (or on first prompt,
   `goto(\`/agents/${tree.id}#turn:${turnId}\`, { replaceState: true })`). No
   path change; the new turn becomes the target and its form is shown with
   focus.
5. UI reactively updates via live query on `agentChatTurnsCollection`.

## Styles

- **bits-ui Tabs**: `[data-tabs-root]`, `[data-tabs-list]`, `[data-tabs-trigger]`,
  `[data-tabs-content]` in `src/styles/bits-ui.css`.
- **Agent chat turn card**: In `AgentChatTurnNode.svelte`, `.turn-card` (position
  relative, padding, border, radius; `[data-status='generating']` pulse,
  `[data-status='error']` error border), `.turn-card-reply` (position absolute,
  inset 0). Reply link text in `<span class="sr-only">`.
- **EntityRefInput**: Local/scoped styles for contenteditable `.prompt-box`
  (min-height, padding, white-space, caret-color, placeholder via
  `data-placeholder`), combobox wrapper, mirror (caret measurement, same font
  as prompt-box), and suggestion list (position fixed at caret).

## Acceptance criteria

- [x] `EntityRefPattern` enum and `entityRefPatternsConfig` in
  `src/constants/entity-ref-patterns.ts`.
- [x] `<EntityRefInput>`: contenteditable prompt box, `@`-triggered combobox
  nested in same wrapper (caret-positioned list), Delete/Backspace when query
  empty closes dropdown leaving `@`; plaintext-only and paste as plain text;
  optional `suggestions` and `autofocus` props.
- [x] `<AgentChatTree>` (colocated in `agents/[nodeId]/`) renders tree
  metadata, default model selector, New conversation link, pin toggle, system
  prompt, and root `<AgentChatTurnNode>`.
- [x] `<AgentChatTurnNode>` (colocated in `agents/[nodeId]/`): card with
  user/assistant, Reply overlay when form hidden, Delete, children; when
  (children + Reply when shown) count > 1, `<Tabs>` with one tab per child +
  Reply tab; prompt form disabled on error, Retry button and
  `retryAgentChatTurn` on error; prompt form only when `#turn:{id}` or dirty;
  autofocus when target; submit updates hash only; optional ModelInput for
  reply.
- [x] Delete turn (and descendants) via `deleteAgentChatTurn`; hash redirect
  if current target was deleted.
- [x] `/agents` lists trees with Pin/Unpin per row; “New conversation” links
  to `/agents/new`.
- [x] `/agents/new` creates a tree and redirects to `/agents/{tree.id}`.
- [x] `/agents/[nodeId]` resolves tree/turn, renders tree; hash `#turn:{id}`
  drives target and form visibility.
- [x] Pinned trees and “New conversation” in nav under Agents.
- [x] `<Tabs>` component encapsulates bits-ui Tabs; AgentChatTurnNode uses it
  with snippet only. Tabs and turn card styles (bits-ui.css and
  component-scoped).

## Sources

- Spec 066: Agent chat data model and collections.
- Spec 051 Part 1: `LlmProvider` abstraction.
- Spec 063: Network/Block/Transaction component hierarchy pattern.

## Status

Complete. Agent chat components are `AgentChatTree` and `AgentChatTurnNode`,
colocated in `src/routes/agents/[nodeId]/`. `<Tabs>` wraps bits-ui Tabs
(consumers use snippet only). EntityRefInput: contenteditable + @-combobox;
Delete/Backspace when query empty leaves `@`. Reply disabled and Retry on
error; hash-driven target; submit updates hash only; Delete cascades.

## Output when complete

`DONE`
