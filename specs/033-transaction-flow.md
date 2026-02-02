# Spec 033: TransactionFlow component

Introduce a reusable TransactionFlow UI component that orchestrates wallet chain
switching, simulation, and execution for one or more transactions. Swap and
bridge flows should adopt the component to centralize these behaviors while
providing custom summaries and per-transaction details via Svelte snippets.

## Overview

TransactionFlow is a generic UI layer that:

- Accepts a wallet connection and determines when EIP-1193 actions are possible
- Prompts for chain switching when the active wallet chain does not match the
  transaction chain
- Runs optional simulations via tevm/Voltaire HTTP providers
- Executes transactions (signing + submission) when available and shows status
- Renders a summary snippet and per-transaction detail snippets supplied by
  feature flows

## Component API

Location: `src/components/TransactionFlow.svelte`

Props:

- `walletConnection: ConnectedWallet | null`
- `Summary?: Snippet`
- `transactions: TransactionFlowItem[]`

Each `TransactionFlowItem` includes:

- `id: string`
- `chainId: number`
- `title: string`
- `actionLabel: string`
- `canExecute: boolean`
- `simulate?: (args) => Promise<unknown>`
- `execute?: (args) => Promise<{ txHash?: 0x… } | void>`
- `requiresConfirmation?: boolean`
- `confirmationLabel?: string`
- `Details?: Snippet`
- `Confirmation?: Snippet`

## UI/UX

- The summary snippet renders once at the top of the flow.
- Each transaction renders a title, detail snippet, optional simulation controls,
  chain-switch prompt, and an action button.
- Confirmation content (when required) renders inline and gates the action
  button behind a checkbox.

## Integration

### Swap flow

- Update `src/routes/swap/SwapFlow.svelte` to pass a single transaction with
  swap-specific details and execution callback.
- Remove the swap-specific chain switching UI in favor of TransactionFlow.

### Bridge flow

- Update `src/routes/bridge/BridgeFlow.svelte` to pass a single transaction with
  bridge-specific details and execution callback.
- Move the confirmation dialog content into TransactionFlow’s confirmation
  snippet.
- Remove the bridge-specific chain switching UI in favor of TransactionFlow.

## Acceptance Criteria

- `TransactionFlow.svelte` exists with the documented props and handles chain
  switching, simulation, and execution state per transaction.
- Simulation uses Voltaire HTTP providers sourced from `rpcUrls` for the
  transaction chain and reports success/failure per transaction.
- When the wallet connection does not support EIP-1193, execution actions are
  disabled and the UI communicates the requirement for a signing-capable wallet.
- Swap and bridge flows render their summaries and per-transaction details via
  TransactionFlow snippets.
- Swap and bridge execution buttons are provided by TransactionFlow (not
  duplicated in the flow).
