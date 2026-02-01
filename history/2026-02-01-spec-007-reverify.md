# Spec 007 re-verification (2026-02-01)

All specs in `specs/` were complete (no unchecked acceptance criteria). Per constitution re-verification mode: picked spec 007 (human-readable amounts) and re-verified.

## Verification

- **Format functions** (`src/lib/format.ts`): `parseDecimalToSmallest`, `formatSmallestToDecimal`, `isValidDecimalInput` present and match spec.
- **Unit tests** (`src/lib/format.spec.ts`): Vitest tests cover parseDecimalToSmallest (empty, whole, decimals, commas, truncation), formatSmallestToDecimal (with maxFractionDigits), isValidDecimalInput. All 9 format tests pass.
- **BridgeFlow** (`src/routes/bridge/BridgeFlow.svelte`): Amount input uses format helpers, balance display, Max button, insufficient balance / validation errors, quote params use `settings.amount` (bigint).

## Result

No regressions. Spec 007 quality confirmed.
