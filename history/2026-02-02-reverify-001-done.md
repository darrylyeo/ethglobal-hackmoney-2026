# Re-verify spec 001: Constants and networks

- No INCOMPLETE spec in specs/; entered Re-Verification Mode.
- Picked spec **001 Constants and networks**.
- Verified acceptance criteria:
  - NetworkType enum (Mainnet/Testnet) ✓
  - ChainId enum ~40 chains ✓
  - networks array with id, name, type; networksByChainId ✓
  - ercTokens USDC per chain; ercTokensBySymbolByChainId ✓
  - Code style: tabs, no semicolons, as const satisfies ✓
- `pnpm test:unit`: passed (Deno + Vitest).
- No code changes; quality confirmed.
