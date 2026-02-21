# Spec 051: Llm explanations for simulations and transactions

Enable on-demand natural language explanations for simulation results and
executed transactions. The implementation uses a **generic AI provider
abstraction** (Part 1) and a **transaction-explanation feature** (Part 2) that
consumes it.

## Scope

- **Part 1 (abstraction):** Define a minimal, feature-agnostic inference
  adapter with availability detection and a single generate entry point. Default
  implementation uses Chrome's Prompt API; optional hosted adapter may be
  configured. Other features may reuse this abstraction.
- **Part 2 (feature):** Provide an on-demand "Explain results" action for
  simulation results and executed transactions, using the abstraction. Define
  explanation payload shape, prompt construction, UI, and persistence.

## Non-goals

- No automatic or background explanations.
- No chat or multi-turn assistant UI.
- No new telemetry, analytics, or usage tracking.
- No provider selection beyond primary + optional fallback.

---

## Part 1: AI provider abstraction

A minimal adapter for on-device or hosted Llm inference. No domain-specific
types (e.g. no "simulation" or "execution"); the feature layer supplies prompts
and interprets responses.

### Availability

```typescript
// src/lib/llmProvider.ts
enum LlmAvailability {
  Available = 'available',
  Downloading = 'downloading',
  Unavailable = 'unavailable',
}
```

- `Available`: Ready to generate.
- `Downloading`: Model is downloading (e.g. Prompt API); generation not yet
  available; optional progress may be reported.
- `Unavailable`: No provider ready (e.g. Prompt API not present, hosted not
  configured).

### Provider interface

```typescript
type LlmGenerateInput = {
	systemPrompt: string
	userPrompt: string
	onProgress?: (progress: number) => void
}

type LlmGenerateOutput = {
	text: string
	providerId: string
}

type LlmProvider = {
	availability: () => Promise<LlmAvailability>
	generate: (input: LlmGenerateInput) => Promise<LlmGenerateOutput>
	cancel?: () => void
}
```

- `availability()`: Current state; may change over time (e.g. after download).
- `generate(input)`: One-shot generation. Uses same options as used for
  availability checks where applicable (e.g. Prompt API).
- `cancel()`: Abort in-flight generation if supported.

### Default: Prompt API adapter

- Backed by Chrome's built-in Prompt API (`globalThis.ai?.languageModel`).
- Use `LanguageModel.availability(options)` with the same options passed to
  `create()` / `prompt()`.
- Require user activation before `LanguageModel.create()`.
- Handle `downloading` and surface progress via `onProgress` when supported.
- Keep sessions short-lived (create per request, destroy after).
- TypeScript: `@types/dom-chromium-ai`; project references via
  `src/prompt-api.d.ts`.

### Optional: Hosted adapter

- Disabled by default; requires explicit configuration (e.g. endpoint + optional
  API key).
- Exposes the same `LlmProvider` interface. `availability()` returns
  `'available'` when configured; `generate()` POSTs a JSON payload (e.g.
  `{ systemPrompt, userPrompt }`) and expects `{ text }` (or equivalent).
- No domain-specific fields in the abstraction; the hosted endpoint may be
  feature-agnostic or feature-specific.

### Provider selection

- Primary: Prompt API adapter.
- Fallback: If Prompt API `availability()` is `'unavailable'` and a hosted
  adapter is configured, use the hosted adapter. No UI to switch providers;
  selection is automatic.

---

## Part 2: Transaction/simulation explanation feature

Uses the AI provider abstraction to explain transaction simulation results and
executed transaction outcomes. Defines domain types, prompt construction, UI,
and persistence.

### Explanation context (domain payload)

Structured snapshot of a simulation or execution result, stripped of secrets,
used to build the user prompt. This is **feature** contract, not part of the
abstraction.

```typescript
type ExplainContext = {
	kind: 'simulation' | 'execution'
	sessionId: string
	simulationId?: string
	executionId?: string
	chainId?: number
	status: 'success' | 'revert' | 'error'
	summary: string
	gas: { used?: string; estimated?: string }
	errors?: { revertReason?: string; errorSelector?: string }
	traceSummary?: string
	eventSummary?: string
	txHash?: `0x${string}`
}
```

### Prompt construction (feature)

- **System prompt:** Fixed instruction, e.g. explain concisely and factually;
  focus on outcomes, gas, errors; no speculation.
- **User prompt:** Derived from `ExplainContext` (kind, status, chain, tx hash,
  gas, revert/error details, trace/event summary). No raw private keys, full
  RPC payloads, or unredacted user data.
- Token budget: TBD (TODO in implementation).

### Explain API (feature entry point)

The feature exposes an `ExplainProvider` (or equivalent) that wraps the
generic `LlmProvider`:

- `availability()` delegates to the underlying `LlmProvider.availability()`.
- `explain(input: ExplainInput)` builds `systemPrompt` and `userPrompt` from
  `input.context`, calls `LlmProvider.generate()`, and returns an
  `ExplainOutput` (e.g. `{ provider: output.providerId, text: output.text }`).
- `ExplainInput` contains `context: ExplainContext`, `language: 'en'`,
  optional `maxTokens`.
- Optional `cancel()` delegates to the underlying provider.

So the **abstraction** stays generic (prompts in, text out); the **feature**
defines ExplainContext, ExplainInput, ExplainOutput, and how they map to/from
the abstraction.

### UI integration

- Add an "Explain results" action in simulation and execution views (where
  simulation has completed or execution has completed/failed).
- Availability state:
  - **Available:** action enabled.
  - **Downloading:** show progress, disable action until ready.
  - **Unavailable:** short tooltip and link to optional fallback setup
    (e.g. `/about#explain-results-fallback`).
- Allow cancellation while the explanation is being generated.

### Persistence

- Store explanation results only when the user requests an explanation.
- Attach to the source record: simulation → session simulation entry;
  execution → execution/finalization entry.
- Record: provider id, prompt version, createdAt, response text. Overwrite vs
  multiple explanations per result: TBD (TODO).

---

## Acceptance criteria

### Part 1 (abstraction)

- [x] A minimal `LlmProvider`-style interface exists with `availability()`,
  `generate()`, and optional `cancel()`.
- [x] Prompt API adapter implements it; uses `LanguageModel.availability()` and
  matching options for `create()`/`prompt()`.
- [x] Hosted adapter is optional and implements the same interface; used only
  when configured and Prompt API is unavailable.

### Part 2 (feature)

- [x] Simulation results and executed transactions expose an on-demand
  "Explain results" action.
- [x] Explanation payloads use `ExplainContext` and omit secrets and raw RPC
  data.
- [x] Explanations are persisted only after a user request (stored with
  provider, promptVersion, createdAt, text).

## TODOs

- Define the exact prompt template and token budget (feature).
- Decide whether to store multiple explanations per result or overwrite
  (feature).

## Sources

- https://developer.chrome.com/docs/ai/prompt-api
- https://chromestatus.com/feature/5134603979063296
- https://github.com/webmachinelearning/prompt-api
- https://www.npmjs.com/package/@types/dom-chromium-ai

## Status

Complete.

## Output when complete

`DONE`
