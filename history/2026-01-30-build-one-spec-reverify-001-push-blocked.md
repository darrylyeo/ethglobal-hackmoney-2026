# Build: one spec (reverify) — push blocked

- **Mode:** Re-verification (all specs marked complete).
- **Spec:** 001 (Constants and networks).
- **Actions:** Re-verified all acceptance criteria against
  `src/constants/networks.ts` and `src/constants/coins.ts`. Ran `pnpm test:unit`
  and `pnpm test:e2e` — all passed.
- **Block:** `git push` rejected (non-fast-forward). Branch is ahead 21,
  behind 12. Need to integrate remote (e.g. pull/rebase) before push.
- **Exit:** Without DONE per PROMPT_build ("If blocked: explain in history/,
  exit without phrase").
