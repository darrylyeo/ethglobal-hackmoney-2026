# Build re-verify: Spec 007 (human-readable amounts)

- All specs marked Complete; re-verification mode.
- Picked spec 007. Verified: format.ts (parseDecimalToSmallest, formatSmallestToDecimal, isValidDecimalInput), format.spec.ts (vitest 9 tests), BridgeFlow amount via CoinAmountInput (balance, Max, validation, comma strip).
- pnpm test:unit (37 deno + 90 vitest), pnpm test:e2e (38 passed, 5 skipped). No regressions.
