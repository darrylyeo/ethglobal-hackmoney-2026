# Spec 070: LLM connections configuration and ModelInput

Let users configure LLM connections (OpenAI, Anthropic, Google, OpenCode Zen, hosted) with API keys when applicable, reuse the wallet-connections UI pattern from Accounts.svelte, and select a model per agent chat tree/turn via a `<ModelInput>` component. Use a modern unified adapter (Vercel AI SDK) for provider APIs.

## Scope

- **Data:** `LlmConnection` type and `llmConnectionsCollection` (TanStack DB, localStorage). Each connection: id, provider, label, optional apiKey, optional defaultModelId; hosted also has optional endpoint.
- **Provider types:** `openai` | `anthropic` | `google` | `zen` | `hosted`. API key required for openai, anthropic, google when used; zen can use env or user key; hosted uses env or user endpoint+key.
- **Settings UI:** Route (e.g. `/settings/llm` or under agents) listing connections, add via dropdown (like Accounts.svelte “Connect wallet”), remove, and inline API key / endpoint input when applicable. Reuse details/cards/chips pattern from `src/routes/wallets/Accounts.svelte`.
- **Adapter:** Use Vercel AI SDK (`ai` + `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`) for OpenAI, Anthropic, Google. Keep existing Zen and hosted paths; factory that returns `LlmProvider` from a connection row.
- **Agent chat:** `createLlmProvider` (and llm-provider/agent-chat flow) accepts optional connection id (and optional model id); when provided, use that connection’s provider and API key; otherwise keep current fallback chain (prompt-api → hosted → zen).
- **ModelInput component:** Dropdown/combobox of available models from configured connections. Value: connection id + model id (e.g. composite string or `{ connectionId, modelId }`). Shown in `<AgentChatTree>` (default model) and `<AgentChatTurnNode>` (per-reply model).
- **Agent chat model selection:** AgentChatTree optional `defaultConnectionId` / `defaultModelId`; AgentChatTurn already has `providerConfig?: { model?: string }` — extend to `providerConfig?: { connectionId?: string, modelId?: string }`. When submitting a turn, pass selected connection/model into `submitAgentChatTurn` and use it in `createLlmProvider`.

## Non-goals

- No server-side storage of API keys (client/localStorage only for this spec).
- No streaming UI change; agent chat remains non-streaming.
- No tool use or agents; text generation only.

## Acceptance criteria

- [x] `LlmConnection` type and `llmConnectionsCollection` exist; connections persisted to localStorage.
- [x] Settings page for LLM connections: list connections, add (dropdown by provider type), remove, edit API key/endpoint where applicable (pattern from Accounts.svelte). Route: `/settings/llm`.
- [x] Vercel AI SDK used for OpenAI, Anthropic, Google; `createLlmProvider({ connectionId?, modelId? })` uses selected connection when given.
- [x] `<ModelInput>` component: value = selected connection+model; options = models from all configured connections; bindable value.
- [x] AgentChatTree and AgentChatTurnNode let user choose model via ModelInput; selection stored and used when generating (submitAgentChatTurn / createLlmProvider).
