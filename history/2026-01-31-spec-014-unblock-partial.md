# Spec 014 E2E bridge flow – partial unblock

**Date:** 2026-01-31

## Done

1. **Layout**
   - Wrapped Boundary in `<main id="main-content">` so skip link and E2E have a single target.
   - Disabled `compilerOptions.experimental.async` in svelte.config.js so route segment no longer suspends; Boundary resolves and bridge content renders.

2. **Bridge page**
   - Removed duplicate `id="main-content"` from bridge page (was on inner `<main>`); use `<div>` for content wrapper so only layout has main#main-content.

3. **E2E**
   - One test passes: "without wallet: clear message and connect prompt" (page loads, #main-content shows "USDC Bridge" / "Connect a wallet").
   - Mock wallet: added waitFor for [data-wallet-provider-option], eth_chainId in mock, longer timeout for [data-wallet-address].

## Still blocked

- Tests that connect the mock wallet still fail: after clicking [data-wallet-provider-option], [data-wallet-address] never appears (timeout 15s). Provider option is visible and click runs; connect() either never gets the mock response or state does not update in the built app. Likely EIP-6963 mock in addInitScript + preview environment (timing or request shape). Not resolved this session.

## Exit

Spec 014 remains incomplete (automated E2E happy path with mock wallet does not pass). Exiting without DONE per PROMPT_build.md.
