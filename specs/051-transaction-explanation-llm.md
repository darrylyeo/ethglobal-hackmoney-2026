# Spec 051: LLM explanations for simulations and transactions

Enable on-demand natural language explanations for simulation results and
executed transactions using a minimal inference adapter. Default to Chrome's
built-in Prompt API when available, with an optional hosted fallback for
environments that cannot run on-device inference.

## Scope

- Provide an on-demand "Explain results" action for:
  - Simulation results (draft session simulations).
  - Executed transactions (receipt/finalization results).
- Define a minimal inference adapter interface with availability detection and
  a single `explain` entry point.
- Default provider uses Chrome Prompt API (Gemini Nano on-device).
- Optional hosted LLM adapter may be configured via API key or server endpoint.
- Persist explanations only when requested by the user.

## Non-goals

- No automatic or background explanations.
- No chat or multi-turn assistant UI.
- No new telemetry, analytics, or usage tracking.
- No provider selection beyond primary + optional fallback.

## Definitions

### Explanation request

A single user-initiated prompt that requests a summary/explanation of a specific
simulation or transaction result.

### Provider availability

One of `available`, `downloading`, or `unavailable`, aligned to the Prompt API
availability checks.

### Explanation payload

A structured snapshot of simulation or execution results, stripped of secrets,
used to build the model prompt.

## Adapter design

### Minimal interface

```ts
type ExplainAvailability = 'available' | 'downloading' | 'unavailable'

type ExplainContext = {
	kind: 'simulation' | 'execution'
	sessionId: string
	simulationId?: string
	executionId?: string
	chainId?: number
	status: 'success' | 'revert' | 'error'
	summary: string
	gas: {
		used?: string
		estimated?: string
	}
	errors?: {
		revertReason?: string
		errorSelector?: string
	}
	traceSummary?: string
	eventSummary?: string
	txHash?: `0x${string}`
}

type ExplainInput = {
	context: ExplainContext
	language: 'en'
	maxTokens?: number
}

type ExplainOutput = {
	provider: 'prompt-api' | 'hosted'
	text: string
}

type ExplainProvider = {
	availability: () => Promise<ExplainAvailability>
	explain: (input: ExplainInput) => Promise<ExplainOutput>
	cancel?: () => void
}
```

### Prompt API adapter (default)

- Use `LanguageModel.availability()` with matching options used in `prompt()`.
- Require user activation before `LanguageModel.create()`.
- Handle `downloading` state and surface progress to the user.
- Keep per-request sessions short-lived to avoid long-lived context.
- Use `@types/dom-chromium-ai` for TypeScript types.

### Hosted LLM adapter (optional)

- Disabled by default and requires explicit configuration.
- Should expose a single HTTP endpoint or SDK call matching `ExplainInput`.
- Must respect the same payload constraints and output expectations.

## Prompt payload

- Use the minimal summarized payload from the session or execution record.
- Include status, gas totals, revert reasons, and high-level trace/event summary.
- Do not include raw private keys, full RPC payloads, or unredacted user data.
- Provide a fixed system instruction to keep outputs concise and factual.

## UI integration (high level)

- Add an "Explain results" action in simulation and execution views.
- Show availability state:
  - Available: action enabled.
  - Downloading: show progress and disable until ready.
  - Unavailable: show a short tooltip and link to optional fallback setup.
- Allow cancellation while the explanation is being generated.

## Persistence

- Store explanation results alongside their source record:
  - Simulation: attach to session simulation entry.
  - Execution: attach to execution/finalization entry.
- Record provider, prompt version, createdAt, and response text.

## Acceptance criteria

- [x] Simulation results and executed transactions expose an on-demand
  "Explain results" action.
- [x] A minimal adapter interface exists with `availability()` and `explain()`.
- [x] Chrome Prompt API is the default provider when available.
- [x] Hosted fallback adapter is optional and disabled by default.
- [x] Explanation payloads omit secrets and raw RPC data.
- [x] Explanations are persisted only after a user request.

## TODOs

- TODO: Define the exact prompt template and token budget.
- TODO: Decide whether to store multiple explanations per result or overwrite.

## Sources

- https://developer.chrome.com/docs/ai/prompt-api
- https://chromestatus.com/feature/5134603979063296
- https://github.com/webmachinelearning/prompt-api
- https://www.npmjs.com/package/@types/dom-chromium-ai

## Status

Complete.

## Output when complete

`DONE`
