# Spec 001 re-verify: push blocked

- Re-verified spec 001 (constants and networks): all acceptance criteria
  satisfied.
- Fixed regression: `src/constants/tokens.ts` used `Network` as value; `Network`
  is a type. Switched to `ChainId`.
- Unit tests: deno (6) + vitest (3) pass.
- Commit created:
  `fix(constants): use ChainId in tokens.ts (Network is a type)`.
- Push rejected: main behind origin (non-fast-forward). Resolve with pull/rebase
  then push.
