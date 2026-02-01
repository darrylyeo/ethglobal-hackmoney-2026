# Spec 007 re-verification (2026-02-01)

Re-verified spec 007 (human-readable amount input) per constitution re-verification mode.

- **Format functions:** `parseDecimalToSmallest`, `formatSmallestToDecimal`, `isValidDecimalInput` in `src/lib/format.ts`. Unit tests in `src/lib/format.spec.ts` (vitest) cover all acceptance criteria.
- **BridgeFlow:** Inline amount input uses format helpers; balance display, Max button, exceedsBalance/validation errors; `canSendAmount` disables Send when invalid or exceeds balance; quote params use `settings.amount`.
- **Tests:** `pnpm run test:unit` — all passed (deno + vitest including format.spec.ts).

No regressions. Quality confirmed.
