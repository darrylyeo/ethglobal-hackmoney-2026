# Spec 115: EIP-1193 wallet connection for x402 payments on agent chat turns

Allow binding an account backed by an EIP-1193 transport to an agent chat tree or turn so that the LLM chat flow can initiate x402 (HTTP 402 Payment Required) payments to selected EIP-8004 agents. The user chooses which wallet connection is used for payments; the app uses that provider to satisfy 402 responses when the chat invokes paid agent endpoints.

## Scope

- **Data model:** Optional payment wallet binding on `AgentChatTree` and/or `AgentChatTurn`: store a reference to the wallet connection used for x402 (e.g. `paymentWalletConnection$id` or `paymentConnectionId`). Only EIP-1193 connections are eligible (signing-capable); read-only connections cannot be selected for payments.
- **UI:** In agent chat (tree or turn context), a control to “Use this wallet for agent payments” or “Payment account” that selects from currently connected EIP-1193 wallets (reuse pattern from Accounts.svelte / session wallet selector). Display which account is selected and allow clear/change.
- **x402 flow:** When a turn triggers a request to an EIP-8004 agent that returns HTTP 402 Payment Required, the app uses the bound EIP-1193 provider to complete the payment (per x402 protocol: parse payment instructions, sign/submit transaction, then retry the request with proof). Success/failure and payment amount are reflected in turn state or tool result where applicable.
- **Turn/tool integration:** If agent chat uses tools that call external agent endpoints (e.g. MCP or direct agent API), those tools receive access to the payment provider for the current turn/tree so they can perform x402 when the server responds with 402.

## Non-goals

- No automatic wallet connection; user must have connected an EIP-1193 wallet and explicitly bind it for payments.
- No multi-chain payment routing in this spec; single chain per payment as defined by x402 response.
- No reputation or validation registry usage; payment only.

## Data model

### AgentChatTree extension

```typescript
// Optional: which wallet connection to use for x402 payments in this tree
paymentWalletConnection$id?: WalletConnection$Id | null
```

Or by connection id if the app identifies connections by id. Only connections with `transport === WalletConnectionTransport.Eip1193` are valid.

### AgentChatTurn extension (optional override)

```typescript
// Optional override for this turn; if null, inherit from tree
paymentWalletConnection$id?: WalletConnection$Id | null
```

When submitting a turn or running a tool that may hit a paid endpoint, resolve the effective payment wallet: turn override ?? tree default ?? null. If null, x402 flows show “Connect a wallet for agent payments” or disable paid agent calls.

## UI

- **Payment wallet selector:** In `AgentChatTree` or a shared agent-chat toolbar: dropdown or chip list of connected EIP-1193 wallets; selection stored as `paymentWalletConnection$id`. Show “No payment wallet” when unset; show selected address (short) when set.
- **Per-turn override (optional):** In `AgentChatTurnNode` reply area, optional “Payment account for this reply” that overrides the tree default for the new turn. Stored on the new turn.

## x402 integration

- **402 handler:** When an outbound request (from the LLM flow or a tool) receives HTTP 402, parse the response body for x402 payment instructions (chain, amount, token, recipient, etc.). Use the resolved EIP-1193 provider to build and sign the transaction (or use an x402 client library if adopted). After payment is confirmed, retry the request with the required proof header/body per x402.
- **Tool context:** If turns have tool calls (e.g. `toolCalls` / `toolResults` in AgentChatTurn), the execution context for those tools must receive the resolved `EIP1193Provider` (or a payment delegate) so that tools that call agent endpoints can trigger the 402 flow when needed.
- **Error handling:** If no payment wallet is bound and a 402 is received, surface a clear message and optionally prompt to set payment wallet. If payment fails (revert, insufficient funds), record in turn error or tool result.

## Acceptance criteria

- [x] `AgentChatTree` has optional `paymentWalletConnection$id`; only EIP-1193 connections can be stored.
- [x] Optional `AgentChatTurn.paymentWalletConnection$id` override; resolution order turn ?? tree ?? null.
- [x] UI to select/clear payment wallet for a tree (and optionally per turn) from connected EIP-1193 wallets.
- [x] When a request in the agent chat flow receives HTTP 402, use the resolved payment provider to complete x402 payment and retry the request.
- [x] Tool execution context for agent chat has access to the payment provider for the current turn/tree.
- [x] Clear UX when payment wallet is missing or payment fails (message, optional prompt to bind wallet).

## Sources

- https://docs.x402.org/ (or x402.org, PayAI docs)
- EIP-1193: Ethereum provider API (existing `EIP1193Provider` in `src/lib/wallet.ts`)
- Spec 066: Agent chat data model
- Spec 067: Agent session UI
- Spec 031: Wallet connection transport (Eip1193 vs None)
- Spec 114: EIP-8004 agent explorer (selected agents as payment targets)

## Status

Complete. 2026-02-21 (PROMPT_build execute one spec): AgentChatTree and AgentChatTurn have optional `paymentWalletConnection$id`; only EIP-1193 connections stored via UI. Resolution turn ?? tree ?? null in submitAgentChatTurn. Payment account selector in AgentChatTree.svelte (EIP-1193 wallets only); optional per-turn override via submitAgentChatTurn options. getPaymentProvider in WalletConnections.ts; getPaymentProvider passed in LlmGenerateWithToolsOptions and ExecuteContext; buildAISdkToolsFromWebmcp and connection-provider pass it through. fetchWith402 in src/lib/x402.ts: on 402 uses payment provider to pay (parse402Body, pay402) and retry; throws PAYMENT_WALLET_REQUIRED_MESSAGE when no provider. Error UX: turn error message plus hint to set Payment account when error mentions payment/402. Tools receive getPaymentProvider in context for paid agent endpoint calls.
