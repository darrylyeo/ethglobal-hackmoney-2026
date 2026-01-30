# Spec 005: Bits UI bridge interface (no CSS)

Minimal UI to drive the LI.FI USDC bridge using Bits UI, without custom CSS (Bits UI unstyled).

## Acceptance criteria

- [ ] At least one route/quote flow is driven from the UI: user can trigger “get route” or “get quote” (e.g. pick chains, amount, then submit).
- [ ] UI is built with Bits UI primitives (e.g. select, input, button); no Bits UI CSS imported (unstyled).
- [ ] UI reads from TanStack DB or app state for chains/tokens and from LI.FI integration for routes/quotes.
- [ ] No ethers/viem in the frontend; Voltaire is used for any chain interaction triggered by the UI.
- [ ] E2E or Vitest test: user flow (or programmatic equivalent) selects options and triggers route/quote and assertion on result or visible state.

## Status

Incomplete.

## Output when complete

` DONE `
