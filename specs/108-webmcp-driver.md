# Spec 108: WebMCP as driver for actions, navigation, and dashboards

Expose all action flows, navigation, and dashboard modifications as WebMCP tools via `navigator.modelContext`. AI agents (browser assistants, Cursor, Claude) can invoke these tools when the app is open, enabling semantic, token-efficient automation instead of DOM/screenshot manipulation.

## Scope

- WebMCP tool registration for action flows (session create/edit, simulation, execution)
- WebMCP tool registration for navigation (goto, watch/unwatch entities, dashboard switch)
- WebMCP tool registration for dashboard modifications (create, delete, rename, split, focus, panel routes)
- **Agent chat as MCP driver:** Chat sessions invoke the same tools; in-app LLM drives actions, navigation, and dashboards via tool calls
- Shared tool layer: WebMCP and agent chat both use the same tool definitions and execute handlers
- Feature detection and polyfill strategy
- User-in-the-loop (`requestUserInteraction`) for sensitive operations
- Single registration point at app bootstrap

## Non-goals

- Replacing the LLM provider or agent chat UI (chat is enhanced with tool calling, not replaced)
- Backend MCP server (this is client-side only)
- Supporting agents that do not run in a WebMCP-capable browser

## Dependencies

- W3C WebMCP spec (Community Group Draft, Feb 2026)
- Chrome 146+ or `@mcp-b/global` polyfill
- Specs 046 (sessions), 044 (dashboards), 066 (agent chat data model), 067 (agent session UI), 084 (watched entities), 077 (intents), 091 (navigation), 101 (session URL)

## Definitions

- **WebMCP**: Browser API (`navigator.modelContext`) allowing web pages to register tools callable by AI agents
- **Tool**: A named function with JSON Schema input, natural-language description, and execute callback
- **readOnlyHint**: Tool annotation indicating no state mutation; agents may call without confirmation
- **requestUserInteraction**: Callback to show UI and await user confirmation before proceeding

## Architecture

### Registration flow

1. App mounts (`+layout.svelte` or root component)
2. Check `'modelContext' in navigator`
3. If available: call `provideContext` with full tool set, or `registerTool` per tool
4. If polyfill: load `@mcp-b/global` and register same tools
5. On route change or collection update, optionally call `provideContext` to refresh tool availability (e.g. after session create)

### Tool categories

| Category | Tools | readOnlyHint | requestUserInteraction |
| --- | --- | --- | --- |
| **Action flows** | createSession, updateSessionParams, simulateSession, executeSession, getSession | get, create (ephemeral) | simulate, execute |
| **Navigation** | navigate, listWatchedEntities, watchEntity, unwatchEntity, getCurrentRoute | list, get | — |
| **Dashboards** | listDashboards, getDashboard, createDashboard, deleteDashboard, renameDashboard, setDefaultDashboard, setPanelRoute, splitPanel, setFocus | list, get | delete, split |
| **Intents** | resolveIntent, createSessionFromIntent | resolve | createSessionFromIntent |

## Tool specifications

### Action flows

#### `createSession`

Create a new transaction session (ephemeral or persisted).

- **Input schema:**
```json
{
  "type": "object",
  "properties": {
    "template": { "type": "string", "enum": ["Swap", "Bridge", "Transfer", "AddLiquidity", "RemoveLiquidity", "CollectFees", "IncreaseLiquidity"] },
    "actions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "action": { "type": "string" },
          "params": { "type": "object" }
        }
      }
    },
    "persist": { "type": "boolean", "default": true }
  }
}
```

- **Execute:** Call `createSession` from sessions collection; if `persist`, insert and return session id; otherwise return ephemeral session. Navigate to `/session/[id]` or `/session?template=...`.
- **readOnlyHint:** false (creates state)
- **requestUserInteraction:** Not required for create; execution tools handle signing

#### `updateSessionParams`

Update params for an existing session.

- **Input schema:** `sessionId`, `params` (partial)
- **Execute:** Load session, merge params, update collection. Used when agent fills form fields.
- **readOnlyHint:** false

#### `simulateSession`

Run TEVM simulation for a session.

- **Input schema:** `sessionId`
- **Execute:** Call existing simulation flow. **requestUserInteraction:** true (user confirms simulation)
- **readOnlyHint:** false

#### `executeSession`

Submit transaction for a session (requires wallet).

- **Input schema:** `sessionId`
- **Execute:** Call existing execution flow. **requestUserInteraction:** true (user signs)
- **readOnlyHint:** false

#### `getSession`

Read session by id.

- **Input schema:** `sessionId`
- **readOnlyHint:** true

---

### Navigation

#### `navigate`

Navigate to a route. When the app is in dashboard mode, `target: "panel"` updates the focused panel; `target: "page"` (default) updates top-level URL.

- **Input schema:**
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string" },
    "params": { "type": "object" },
    "replace": { "type": "boolean", "default": false },
    "target": { "type": "string", "enum": ["page", "panel"], "default": "page" }
  },
  "required": ["path"]
}
```

- **Execute:** If `target === "panel"`, call `setPanelRoute` for focused panel in current dashboard; else `goto(path, { replaceState: replace })`.
- **readOnlyHint:** false (changes URL / panel state)

#### `listWatchedEntities`

Return watched entities for nav.

- **readOnlyHint:** true
- **Execute:** `listWatchedEntities()` → derive rows, return as JSON

#### `watchEntity`

Add entity to watched list.

- **Input schema:** `entityType`, `entityId` (typed per EntityType)
- **Execute:** `watchEntity({ entityType, entityId })`
- **readOnlyHint:** false

#### `unwatchEntity`

Remove entity from watched list.

- **Input schema:** `entityType`, `entityId`
- **Execute:** `unwatchEntity(entityType, entityId)`
- **readOnlyHint:** false

#### `getCurrentRoute`

Return current SvelteKit route (pathname, params, search).

- **readOnlyHint:** true

---

### Dashboards

#### `listDashboards`

Return all dashboards with id, name, isDefault.

- **readOnlyHint:** true

#### `getDashboard`

Return dashboard state (root tree, focusedPanelId, panels).

- **Input schema:** `dashboardId`
- **readOnlyHint:** true

#### `createDashboard`

Create a new dashboard.

- **Input schema:** `name` (optional)
- **Execute:** `createDashboard(name)` → return new id
- **readOnlyHint:** false

#### `deleteDashboard`

Delete a dashboard.

- **Input schema:** `dashboardId`
- **Execute:** `deleteDashboard(id)`. **requestUserInteraction:** true (confirm delete)
- **readOnlyHint:** false

#### `renameDashboard`

Rename a dashboard.

- **Input schema:** `dashboardId`, `name`
- **Execute:** `renameDashboard(id, name)`
- **readOnlyHint:** false

#### `setDefaultDashboard`

Set the default dashboard.

- **Input schema:** `dashboardId`
- **Execute:** `setDefaultDashboardId(id)`
- **readOnlyHint:** false

#### `setPanelRoute`

Change a panel's route.

- **Input schema:** `dashboardId`, `panelId`, `path`, `params`
- **Execute:** Find panel in tree, update `route`, persist. Used for "open X in this panel".
- **readOnlyHint:** false

#### `splitPanel`

Split a panel horizontally or vertically.

- **Input schema:** `dashboardId`, `panelId`, `direction` (horizontal|vertical), `ratio` (0–1), `newPanelRoute`
- **Execute:** Replace panel node with split node; existing panel stays; new panel gets `newPanelRoute`. Persist via `updateDashboardState` / `setDashboardRoot`.
- **readOnlyHint:** false

#### `setFocus`

Set the focused panel.

- **Input schema:** `dashboardId`, `panelId`
- **Execute:** `setDashboardFocus(id, panelId)`
- **readOnlyHint:** false

---

### Intents

#### `resolveIntent`

Resolve an intent from source + target entity (same logic as drag-and-drop).

- **Input schema:** `sourceEntityRef`, `targetEntityRef` (each: `entityType`, `entityId`)
- **Execute:** `resolveIntentForDrag(source, target)` → return `{ matched, intent, options }` or `{ matched: false }`
- **readOnlyHint:** true

#### `createSessionFromIntent`

Create a session from a resolved intent option.

- **Input schema:** `intentType`, `optionIndex`, `sourceEntityRef`, `targetEntityRef`
- **Execute:** Call `resolveIntentForDrag`, take `options[optionIndex]`, build session from `ProtocolActionPayload[]`, create session, navigate
- **readOnlyHint:** false
- **requestUserInteraction:** Optional (e.g. for multi-step flows)

---

## Agent chat as MCP driver

The in-app agent chat (`/agents`) uses the **same tool layer** as WebMCP. When the user asks "bridge 100 USDC from Ethereum to Base", the LLM can respond with a tool call instead of (or in addition to) text. The chat executes that tool via the shared handlers, making the chat session an MCP driver alongside external agents.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Tool definitions (name, description, inputSchema)           │
│  + execute handlers (createSession, navigate, etc.)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐
│  WebMCP registration│   │  Agent chat          │
│  (navigator.        │   │  (submitAgentChatTurn│
│   modelContext)     │   │   with tool calling) │
└─────────────────────┘   └─────────────────────┘
```

- **Shared layer:** `src/lib/webmcp/handlers.ts` (or equivalent) exports `getToolDefinitions()` and `executeTool(name, input, context)`. Both WebMCP and agent chat import these.
- **WebMCP:** Registers tools by mapping definitions + handlers to `navigator.modelContext.registerTool`.
- **Agent chat:** Passes `getToolDefinitions()` to the LLM as function/tool definitions; when the LLM returns a tool call, calls `executeTool()` and appends the result to the conversation.

### LlmProvider extension

Extend `LlmProvider` (or create `LlmProviderWithTools`) to support tool calling:

```ts
type LlmGenerateWithToolsInput = LlmGenerateInput & {
  tools: { name: string, description: string, inputSchema: object }[]
}

type LlmGenerateWithToolsOutput =
  | { kind: 'text', text: string, providerId: string }
  | { kind: 'toolCall', toolName: string, toolInput: object, providerId: string }
```

- `generateWithTools(input)`: Sends messages + tool definitions to the LLM. If the response is a tool call, return `{ kind: 'toolCall', ... }`. If it is plain text, return `{ kind: 'text', ... }`.
- Zen / hosted providers must support OpenAI-compatible `tools` and `tool_calls` in the request/response. Prompt API (`ai.languageModel`) has its own tool-calling surface.

### Agent chat flow with tools

1. User submits prompt: "Create a bridge session from Ethereum to Base with 100 USDC."
2. `submitAgentChatTurn` (or `submitAgentChatTurnWithTools`) calls `provider.generateWithTools({ ...messages, tools: getToolDefinitions() })`.
3. LLM returns `{ kind: 'toolCall', toolName: 'createSession', toolInput: { template: 'Bridge', ... } }`.
4. Chat calls `executeTool('createSession', toolInput, { requestUserInteraction })`. For createSession, no confirmation needed; handler creates session and navigates.
5. Append assistant turn: store `toolCalls: [{ name, input }]` and `toolResults: [{ name, result }]` in `AgentChatTurn` (extend data model).
6. Optionally: send tool result back to the LLM for a follow-up text response ("I've created the bridge session. You can review and simulate it.").

### AgentChatTurn data model extension

```ts
// Extend AgentChatTurn (spec 066)
type AgentChatTurn = {
  // ...existing fields
  assistantText: string | null
  toolCalls?: { name: string, input: object }[]
  toolResults?: { name: string, result: unknown, error?: string }[]
}
```

- When `toolCalls` is present, the turn displays the tool invocation(s) and result(s) instead of (or in addition to) `assistantText`.
- `AgentChatTurnNode` renders: user prompt → tool call block (name + truncated input) → tool result (or error) → optional assistant text.

### User-in-the-loop from chat

Tools that require `requestUserInteraction` (executeSession, simulateSession, deleteDashboard) receive a **chat-specific context**:

- `executeTool(name, input, { requestUserInteraction: async (cb) => { ... } })`
- The chat provides a `requestUserInteraction` that shows an in-conversation confirmation (e.g. modal or inline "Confirm" button).
- User clicks Confirm → callback runs → tool proceeds; Cancel → tool aborted, error stored in turn.

### Tool visibility for chat

The chat may expose a **subset** of tools to reduce noise and token cost (e.g. exclude low-level dashboard split/focus). A config: `toolsForChat: ToolName[]` filters `getToolDefinitions()` to only those the LLM can call from the chat. Full set remains for WebMCP.

## Implementation

### File layout

| File | Purpose |
| --- | --- |
| `src/lib/webmcp/handlers.ts` | Shared: `getToolDefinitions()`, `executeTool(name, input, context)` |
| `src/lib/webmcp/register.ts` | WebMCP registration; `registerWebMcpTools()`, `clearWebMcpTools()` |
| `src/lib/webmcp/tools/action-flows.ts` | Session tool handlers (create, update, simulate, execute, get) |
| `src/lib/webmcp/tools/navigation.ts` | Navigation tool handlers |
| `src/lib/webmcp/tools/dashboards.ts` | Dashboard tool handlers |
| `src/lib/webmcp/tools/intents.ts` | Intent tool handlers |
| `src/lib/webmcp/schemas.ts` | Shared JSON Schema definitions |
| `src/lib/webmcp/polyfill.ts` | Load `@mcp-b/global` when native API missing |
| `src/lib/agentChat.ts` | Extend with `submitAgentChatTurnWithTools`, tool-call flow |
| `src/lib/llmProvider.ts` | Extend with `generateWithTools` |

### Registration entry point

```ts
// src/lib/webmcp/register.ts
import { getToolDefinitions, executeTool } from '$/lib/webmcp/handlers.ts'

export const registerWebMcpTools = async (client?: ModelContextClient) => {
  if (!('modelContext' in navigator)) await loadPolyfill()
  const mc = (navigator as Navigator & { modelContext?: ModelContext }).modelContext
  if (!mc) return
  const definitions = getToolDefinitions()
  mc.provideContext({
    tools: definitions.map((d) => ({
      ...d,
      execute: (input, mcClient) =>
        executeTool(d.name, input, { requestUserInteraction: mcClient?.requestUserInteraction }),
    })),
  })
}
```

### Integration point

- Call `registerWebMcpTools()` from `+layout.svelte` in `$effect` (client-only)
- Pass `client` into execute callbacks when tool needs `requestUserInteraction`; receive from second execute arg

### BigInt and JSON

- `inputSchema` and tool results must serialize to JSON. Coerce `bigint` to string in params (e.g. `amount: "1000000"`) and parse in execute.

## Security

- All tools run in same origin; no cross-origin exposure
- Sensitive tools (executeSession, deleteDashboard, simulateSession) require `client.requestUserInteraction` before proceeding
- Read-only tools use `readOnlyHint: true` so agents can call without confirmation
- Tool names must be unique; use prefix if needed (e.g. `blockhead_createSession`)

## Acceptance criteria

### WebMCP

- [ ] `navigator.modelContext` (or polyfill) used to register tools at app mount
- [ ] All action-flow tools (createSession, updateSessionParams, simulateSession, executeSession, getSession) registered and delegating to existing logic
- [ ] All navigation tools (navigate, listWatchedEntities, watchEntity, unwatchEntity, getCurrentRoute) registered
- [ ] All dashboard tools (listDashboards, getDashboard, createDashboard, deleteDashboard, renameDashboard, setDefaultDashboard, setPanelRoute, splitPanel, setFocus) registered
- [ ] Intent tools (resolveIntent, createSessionFromIntent) registered
- [ ] `requestUserInteraction` used for executeSession, simulateSession, deleteDashboard
- [ ] `readOnlyHint: true` for list/get tools
- [ ] Feature detection: no registration when API absent and polyfill load fails
- [ ] Unit test: tool schemas valid; execute handlers call correct collection/route functions
- [ ] E2E (optional): Chrome with WebMCP flag; external MCP client connects and lists tools

### Agent chat as MCP driver

- [ ] Shared `getToolDefinitions()` and `executeTool()` used by both WebMCP registration and agent chat
- [ ] LlmProvider supports `generateWithTools` (or equivalent) with tool definitions and tool-call response parsing
- [ ] `submitAgentChatTurnWithTools` (or extended `submitAgentChatTurn`) passes tools to LLM and handles tool-call responses
- [ ] AgentChatTurn extended with `toolCalls` and `toolResults`; AgentChatTurnNode renders them
- [ ] Chat-specific `requestUserInteraction` shows in-conversation confirmation for sensitive tools before execution
- [ ] Optional `toolsForChat` filter to restrict which tools the chat LLM can call

## Status

Draft.

## References

- [WebMCP W3C spec](https://webmachinelearning.github.io/webmcp/)
- [webmcp.link](https://webmcp.link/)
- [Chrome WebMCP early preview](https://developer.chrome.com/blog/webmcp-epp)
- Syntax #973: The Web's Next Form: MCP UI
