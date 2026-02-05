# Atomic commit plan

## Completed (this run)

| # | SHA      | Message |
|---|----------|---------|
| 1 | 39e586b  | Live query: register via $effect, remove attachment API |
| 2 | 1710f20  | Routes, views, layout: use register*LiveQueryStack, remove @attach |
| 3 | d0888ee  | Remove LiveQueryScope (unused) |
| 4 | 4779502  | Session: rename UnifiedBridgeFlow to BridgeAction |
| 5 | 70ff904  | Theme: use light-dark(), remove app theme script |
| 6 | 89ce25c  | Proxy: allow requests with no Origin |
| 7 | 4dcae72  | Stork: default Dev region, websocket fallback, fix price URL |
| 8 | ac8d6f5  | Layout: "Add Liquidity" label |
| 9 | 1409f93  | Styles: data-* primitives and ItemsList |
| 10 | 1194701  | Components, routes, views: use data-* primitives |
| 11 | 084ccae  | Specs: doc updates |
| 12 | 7d7f505  | chore: update commit plan |

## Commit later / uncommitted

- `.cursor/agents/`, `.cursor/rules/`, `.cursor/skills/`
- `history/2026-02-05-build-reverify-039-e2e-partial.md`
- `specs/065-external-api-cache-live-queries.md`

## Completed (previous runs)

| # | SHA      | Message |
|---|----------|---------|
| 1 | 02d2731  | Voltaire: use ERC20 SELECTORS and decodeUint256 |
| 2 | 1c74df9  | Format: Deno-only section spacing script, remove Prettier and other lockfiles |
| 3 | 4911403  | Specs 041, 043, 056: completion and AC for manual formatting and Deno-only runtime |
| 4 | 180f743  | Format: apply section spacing to src |
| 5 | a16b3cf  | Env: add PUBLIC_STORK_REST_TOKEN to .env.example |
| 6 | 5eaf4f8  | Styles: add data-grid primitive and dl, remove data-balances-grid |
| 7 | be88995  | Routes, views: migrate to data-grid; e2e use data-balances |
| 8 | b84795e  | TransferDialog: remove extra blank line |
