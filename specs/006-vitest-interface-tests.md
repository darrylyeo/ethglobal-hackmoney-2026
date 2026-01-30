# Spec 006: Vitest coverage for interface behavior

Vitest ensures the bridge interface behaves as specified: constants, data layer, Voltaire, LI.FI, and UI integration.

## Acceptance criteria

- [ ] Vitest test suite runs with `pnpm test:unit` (or project’s Vitest script) and all tests pass.
- [ ] Tests cover: constants/networks (shape or values), TanStack DB normalization or collection shape, Voltaire RPC/ABI usage, LI.FI route/quote handling, and at least one integration path (e.g. “get quote” from UI or service).
- [ ] No tests depend on ethers/viem; mocks or real calls use Voltaire where chain interaction is tested.
- [ ] README or constitution is updated if the test command or coverage expectations change.

## Status

Incomplete.

## Output when complete

` DONE `
