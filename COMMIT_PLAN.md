# Granular Atomic Commits (Topological Order)

Each commit results in a valid build. Commits are organized by dependency, not by file.

---

## Completed Commits

| # | Message | SHA |
|---|---------|-----|
| 1 | spec 005: uncheck E2E criteria (pending verification) | a543b68 |
| 2 | Shims: clarify bun:ffi stub scope | 01bc809 |
| 3 | Voltaire: handle empty or short balance response | 1ba3623 |
| 4 | Voltaire: add test for 0n on empty response | 674ccc4 |
| 5 | Scripts: fix Voltaire signer import path | 9013b21 |
| 6 | RPC endpoints: update URLs and transport type | ba421ab |
| 7 | Constants: remove legacy rpc-urls module | a4ab308 |
| 8 | Network status: switch LI.FI API to /v1/chains | 1d78c11 |
| 9 | Collections: use writeUpsert in actors and actor-coins | 233b16f |
| 10 | Transfers: add fetchTransfersGraph | b9e58f3 |
| 11 | App: set color-scheme from theme | 158dc12 |
| 12 | Theme: remove dark mode spec and implementation | 88ab881 |
| 13 | Svelte: add useContext helper | 09258ce |
| 14 | Bridge state: add useBridgeSlippage, useBridgeAutoRefresh | 041979e |
| 15 | Wallet: move state to context, refactor WalletProvider | f4d9267 |
| 16 | Layout: add Tests submenu and test routes | 54e6432 |
| 17 | Root: replace redirect with landing page | 2c27baf |
| 18a | package.json: setup | f3bced7 |
| 18b | check:size: setup | a1ff0d8 |
| 19 | Bridge: inline RouteCard into RouteList | 869ecf0 |
| 20a | AmountInput: align markup | b190a23 |
| 20b | ApprovalButton: align markup | bb94fe4 |
| 20c | ChainSwitchPrompt: align markup | 021ded4 |
| 20d | ErrorDisplay: align markup | 092d63c |
| 20e | FeeBreakdown: align markup | be376a3 |
| 20f | QuoteOutput: align markup | cca5f28 |
| 20g | TransactionHistory: align markup | 64eec73 |
| 21 | Bridge: switch to network objects and shared state | cd6fd3e |
| 22 | Bridge: remove QuoteExpiration and ChainIdSection | d21da88 |
| 23 | e2e: update bridge flow selectors and timeouts | 4a5cd80 |
| 24 | Bridge: update unit tests for API changes | 5af91b0 |
| 25 | Tests: update page and collections tests | ba7a321 |
| 26 | Transfers: remove server load, update page | 181c40f |
| 27 | Styles: update accessibility, bits-ui, components, responsive | cdfdd32 |
| 28 | Navigation: trim; Svelte: update config | af4b603 |
| 30 | `<NumberValue>`, `<Timestamp>`: add | 5ba9f03 |
| 31 | e2e: add Playwright config | d06106c |

---

## Commit later (icons + unused deps)

The following are **not** part of the main commit sequence. Commit when enabling icons/icon tooling.

### Working tree (uncommitted)

| File(s) | Description |
|---------|-------------|
| `package.json` | fflate, svgo deps + icons:\* scripts |
| `scripts/_fetch-chain-icons.ts` | Icons fetch script |
| `static/networks/*.svg` | Network icons |

### Commit order

After each change: run `deno task install`, then commit `package.json` + `deno.lock`.

1. **fflate: install** — `devDependencies`: add `"fflate": "^0.8.2"`
2. **svgo: install** — `devDependencies`: add `"svgo": "^4.0.0"`
3. **icons:fetch: setup** — `scripts`: add `"icons:fetch": "bun run scripts/_fetch-chain-icons.ts"`
4. **icons:optimize: setup** — `scripts`: add `"icons:optimize": "svgo static/networks/*.svg"`
5. **icons: setup** — `scripts`: add `"icons": "bun run icons:fetch && bun run icons:optimize"`
6. **Scripts: add chain icons fetch** — `git add scripts/_fetch-chain-icons.ts`
7. **Static: add network icons** — `git add static/networks/*.svg`
