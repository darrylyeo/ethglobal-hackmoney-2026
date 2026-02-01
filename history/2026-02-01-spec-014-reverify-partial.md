# Spec 014 re-verification – partial

**Date:** 2026-02-01

## Re-verification (all specs complete)

Per constitution Re-Verification Mode: picked spec 014 (E2E bridge flow), re-ran acceptance criteria.

## Fixed

1. **"Connect a wallet to get routes"** – E2E expected this text when no wallet; it was missing. Added `<p data-muted>Connect a wallet to get routes</p>` in `BridgeFlow.svelte` when `!selectedWallet`. Test "without wallet: clear message and connect prompt" now passes.
2. **wallet.test.ts strict mode** – `beforeEach` used `.or(heading, getByText('Connect a wallet to get routes'))`; both are now visible so the locator resolved to 2 elements. Updated to wait for heading only.

## Still blocked

E2E tests that use the mocked wallet fail: after clicking `[data-wallet-provider-option]`, `[data-wallet-address]` never appears (15s timeout). The mock is discovered (option is visible). Likely either `getWallet({ rdns: 'com.mock' })` is undefined in the preview environment or `requestWalletConnection` / `connectProvider` throws before `setConnectionConnected`. Not resolved; same failure with sync and async (setTimeout 0) mock announce.

## Exit

Spec 014 re-verification incomplete due to mock wallet connection in E2E. Exiting without DONE per PROMPT_build.
