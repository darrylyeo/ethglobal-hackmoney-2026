# Spec 050: E2E Tevm walletless testing

Enable Playwright E2E tests to run against a Tevm-backed execution path so tests
do not need external wallets, signatures, or browser wallet extensions.

## Scope

- Replace wallet-connection steps in E2E with Tevm-backed execution.
- Provide deterministic chain state for tests via Tevm node or memory client.
- Cover swap, bridge, transfer, and liquidity flows with walletless execution.
- Persist execution artifacts needed for assertions (logs, receipts, gas).

## Non-goals

- No changes to production wallet flows.
- No E2E coverage of browser wallet extension UX.
- No new chain simulators outside Tevm.

## Background

Tevm node enables local execution and transaction simulation without relying on
external wallets. This spec standardizes an E2E path using Tevm so tests can
submit transactions and validate results without signing UI flows.

## Design

### Tevm test node

- Use `createTevmNode` or `createMemoryClient` with `miningConfig: { type: 'auto' }`.
- Provide fork configuration when production state is required.
- Default to fixed `blockTag` to make tests deterministic.
- Use `common` chain configuration for any forked network.

### Walletless execution path

- Use TransactionFlow execution orchestration with mode-specific callbacks and
  E2E Tevm providers instead of per-flow E2E executors.
- Use impersonation (`setImpersonatedAccount`) for EOA flows.
- Build transactions via `createImpersonatedTx` and execute via `vm.runTx`.
- For contract flows, use Tevm contract helpers or direct `vm.runTx` calls.

### Test harness integration

- Start Tevm node per test file or per suite, with reset between tests.
- Provide a Playwright fixture that exposes Tevm RPC + helpers to tests.
- Persist Tevm receipts/logs for assertions in test output.
- Use `node.request` JSON-RPC for account state and receipts.

### Assertions

- Validate execution success via `execResult.exceptionError`.
- Validate event logs with expected topics and decoded args.
- Validate balance deltas for sender/receiver assets.
- Validate gas usage and receipts for expected transaction type.

## Acceptance criteria

- [x] E2E tests run without connecting or signing with wallets.
- [x] Tevm-backed execution path is isolated to test builds only.
- [x] Swap, bridge, transfer, and liquidity flows have walletless E2E coverage.
- [x] TransactionFlow provides a single execution path for wallet/e2e modes.
- [x] Tests assert on receipts/logs and balance deltas using Tevm data.
- [x] Forked tests use fixed `blockTag` for deterministic runs.

## TODOs

- TODO: Decide whether to share one Tevm node per suite or per test file.
- TODO: Define a standard fixture for Tevm helpers in Playwright.
- TODO: Map which flows require forked state vs local-only execution.

## Sources

- https://node.tevm.sh/examples/local-testing

## Status

Complete.

## Output when complete

`DONE`
