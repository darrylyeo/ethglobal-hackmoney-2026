# Atomic commits — current changes

All modified + untracked (except temp scripts). Topological order; verify with `deno task check` after each code commit.

## Plan (current batch)

(All committed; see Completed below.)

Commit later / leave untracked: scripts/assets/_fetch-one-provider.ts

## Completed (SHAs)

| # | SHA | Message |
|---|-----|---------|
| 1 | 5836b89 | e2e: move support files to e2e/support/ |
| 2 | 8990545 | scripts: add sync/fork-schedules, remove obsolete paths and format task |
| 3 | 52a40c8 | deno: update lockfile |
| 4 | 13519a3 | cursor: format rule — manual Svelte spacing only |
| 5 | 700e3d4 | specs: update paths and format docs (e2e/support, scripts, remove format task) |
| 6 | f489569 | src: formatting and type style (id-serializations, fuzzyMatch, CoinAmount) |
| 7 | 9b83665 | docs: COMMIT_PLAN for script/e2e reorg and spec updates |
| 8 | 108315a | lib: add assetUtils (asset helpers from constants) |
| 9 | c9d41b0 | constants: assets — move helpers to lib, add Farcaster/Covalent |
| 10 | b5e1697 | scripts: sync assets use assetUtils |
| 11 | 3ea2a53 | specs: 052 asset helpers in lib |
| 12 | 10c749e | constants: filter-groups enums and *ById |
| 13 | 7d40541 | CoinsInput, NetworksInput: use filter-groups byId |
| 14 | c9fbf24 | constants: remove re-exports (forks, precompiles, identity, helios) |
| 15 | b3bf322 | api/farcaster: remove barrel, use hub/client/neynar |
| 16 | 0ef8f34 | constants/opcodes: remove barrel |
| 17 | 4d11a29 | lib: remove index barrel |
| 18 | 16bd5d5 | formatIntentOptionLabel, formatSourceList: single-expression style |
| 19 | be00536 | promptValue: arrow and style |
| 20 | 287bef2 | CoinAmount: markup, .coin-label, CSS var |
| 21 | b230001 | NavigationItem: props type, filterTree |
| 22 | 0dbfa40 | components.css: whitespace |
| 23 | f35581a | e2e: coverage-manifest EVM and liquidity routes |
| 24 | ee6eb40 | specs: 056, 076, 113 |
| 25 | 3be8cc5 | deno: lockfile |
