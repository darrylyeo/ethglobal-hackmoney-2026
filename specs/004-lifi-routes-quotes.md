# Spec 004: LI.FI routes and quotes for USDC bridging

Integrate LI.FI SDK: request routes and fetch quotes for USDC bridging across supported chains.

## Acceptance criteria

- [ ] LI.FI SDK (or documented API) is used to get routes and/or quotes for USDC transfer between two chains.
- [ ] User-selectable (or test-configurable) source chain, destination chain, and amount; output is a route or quote (e.g. steps, estimated output, fees).
- [ ] Flow aligns with LI.FI docs: route vs quote distinction respected where applicable (see project links).
- [ ] TanStack DB or app state holds normalized route/quote data consumed by the UI or tests.
- [ ] Vitest test(s) exist: given mock or real LI.FI response, app produces expected route/quote shape (e.g. steps, amounts).

## Status

Incomplete.

## Output when complete

` DONE `
