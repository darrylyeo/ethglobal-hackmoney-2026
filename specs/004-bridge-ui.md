# Spec 004: Bridge UI

Minimal UI to fetch LI.FI USDC bridge quotes using Bits UI primitives (unstyled).

**References:**
- https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example

## UI components

Located in `src/routes/+page.svelte`:

1. **Source chain select** – Bits UI Select, populated from networks
2. **Destination chain select** – Bits UI Select, populated from networks
3. **Amount input** – Bits UI Input, user enters USDC amount
4. **Wallet address input** – Bits UI Input, user enters `0x...` address
5. **Get Quote button** – Bits UI Button, triggers `fetchQuoteCached`
6. **Quote result display** – Shows: estimated output, fees
7. **Error boundary** – `<svelte:boundary>` wraps async operations

## Acceptance criteria

### UI

- [ ] Renders with Bits UI primitives (Select, Input, Button); no Bits UI CSS imported.
- [ ] Chain selects populated from `networks` constant.
- [ ] User can enter amount and wallet address.
- [ ] "Get Quote" calls `fetchQuoteCached` with selected params.
- [ ] Quote result displays `estimatedToAmount` and `fees`.
- [ ] Errors caught by `<svelte:boundary>` and displayed.

### E2E test

- [ ] `e2e/bridge.test.ts` exists and runs with `pnpm test:e2e`.
- [ ] Test: select source chain, destination chain, enter amount and address.
- [ ] Test: click "Get Quote", wait for result.
- [ ] Test: assert quote result is visible.

## Status

Incomplete.

## Output when complete

` DONE `
