# Granular Atomic Commits (Topological Order)

Each commit results in a valid build. Commits are organized by dependency, not
by file.

---

## Pending Commits

None.

---

## Completed Commits

| #   | Message                                                                | SHA     |
| --- | ---------------------------------------------------------------------- | ------- |
| 1   | spec 005: uncheck E2E criteria (pending verification)                  | a543b68 |
| 2   | Shims: clarify bun:ffi stub scope                                      | 01bc809 |
| 3   | Voltaire: handle empty or short balance response                       | 1ba3623 |
| 4   | Voltaire: add test for 0n on empty response                            | 674ccc4 |
| 5   | Scripts: fix Voltaire signer import path                               | 9013b21 |
| 6   | RPC endpoints: update URLs and transport type                          | ba421ab |
| 7   | Constants: remove legacy rpc-urls module                               | a4ab308 |
| 8   | Network status: switch LI.FI API to /v1/chains                         | 1d78c11 |
| 9   | Collections: use writeUpsert in actors and actor-coins                 | 233b16f |
| 10  | Transfers: add fetchTransfersGraph                                     | b9e58f3 |
| 11  | App: set color-scheme from theme                                       | 158dc12 |
| 12  | Theme: remove dark mode spec and implementation                        | 88ab881 |
| 13  | Svelte: add useContext helper                                          | 09258ce |
| 14  | Bridge state: add useBridgeSlippage, useBridgeAutoRefresh              | 041979e |
| 15  | Wallet: move state to context, refactor WalletProvider                 | f4d9267 |
| 16  | Layout: add Tests submenu and test routes                              | 54e6432 |
| 17  | Root: replace redirect with landing page                               | 2c27baf |
| 18a | package.json: setup                                                    | f3bced7 |
| 18b | check:size: setup                                                      | a1ff0d8 |
| 19  | Bridge: inline RouteCard into RouteList                                | 869ecf0 |
| 20a | AmountInput: align markup                                              | b190a23 |
| 20b | ApprovalButton: align markup                                           | bb94fe4 |
| 20c | ChainSwitchPrompt: align markup                                        | 021ded4 |
| 20d | ErrorDisplay: align markup                                             | 092d63c |
| 20e | FeeBreakdown: align markup                                             | be376a3 |
| 20f | QuoteOutput: align markup                                              | cca5f28 |
| 20g | TransactionHistory: align markup                                       | 64eec73 |
| 21  | Bridge: switch to network objects and shared state                     | cd6fd3e |
| 22  | Bridge: remove QuoteExpiration and ChainIdSection                      | d21da88 |
| 23  | e2e: update bridge flow selectors and timeouts                         | 4a5cd80 |
| 24  | Bridge: update unit tests for API changes                              | 5af91b0 |
| 25  | Tests: update page and collections tests                               | ba7a321 |
| 26  | Transfers: remove server load, update page                             | 181c40f |
| 27  | Styles: update accessibility, bits-ui, components, responsive          | cdfdd32 |
| 28  | Navigation: trim; Svelte: update config                                | af4b603 |
| 30  | `<NumberValue>`, `<Timestamp>`: add                                    | 5ba9f03 |
| 31  | e2e: add Playwright config                                             | d06106c |
| 32  | chore: ignore PartyKit state                                           | 01879af |
| 33  | rooms: update SIWE host + peer verification UI                         | c36e3b1 |
| 34  | graph: add entity types + optimize sigma rendering                     | dbf9dcc |
| 35  | yellow: update channel state + nitro rpc envelope                      | f3450e3 |
| 36  | bridge/swap: add stork + token lists + transaction flow + api refactor | 43cadc6 |
| 37  | docs: add stork/transaction flow/graph/cctp specs + history            | e1923a5 |
| 38  | deps: add g6 + nitrolite                                               | fb866a6 |
| 39  | docs: update bridge, yellow, g6, cctp, css specs                       | cefdd28 |
| 40  | styles: add newline to bits-ui css                                     | b674f6e |
| 41  | spec 042: add entity data sources                                      | 1e826ca |
| 42  | Combobox/Select: add Before/After snippets                             | f28b8a3 |
| 43  | Inputs: add coin/network amount components                             | 43134fb |
| 44  | Bridge: use NetworkInput + CoinAmountInput                             | 929294e |
| 45  | Balances: filter token list coins                                      | cc2950f |
| 46  | Stork prices: prefer ready rows                                        | aef6e2e |
| 47  | Styles: replace data-attr selectors with classes                       | 573d72f |
| 48  | COMMIT_PLAN: update with SHAs                                          | c8d13ef |
| 49  | Coins: add metadata + CoinAmount component                             | 996bfae |
| 50  | CoinInput: show icons + type labels                                    | ddde315 |
| 51  | Schema: add data entity models                                         | de264b9 |
| 52  | App: align constants, collections, and UI to schema                    | db4ab3e |
| 53  | Spec 043: track component organization plan                            | b10cd23 |
| 54  | Spec 044: add dashboard panel system                                   | d5bafed |
| 55  | Components: add Dropdown and Icon primitives                           | af11d71 |
| 56  | Views: move domain components out of shared                            | 2cdc807 |
| 57  | Architecture: move graph component into route                          | d85bac6 |
| 58  | Routes: update imports for moved components                            | 3d1e3dc |
| 59  | Rooms: move Peer component into route                                  | 8d873d1 |
| 60  | Bridge: remove lifi route-local views                                  | cc2dc91 |
| 61  | Components: align Select and Toast composition                         | 1837dae |
| 62  | Bridge settings: align defaults                                        | 3588bc8 |
| 63  | NavigationItem: align with view component moves                        | f3b3040 |
| 64  | Bridge routes: adjust collection query shape                           | 5ca8e2d |
| 65  | Spec 043: remove completed spec                                        | 51830ec |

---

## Working tree (uncommitted)

| File(s)                                      | Description                                      |
| -------------------------------------------- | ------------------------------------------------ |
| `COMMIT_PLAN.md`                             | Refresh plan for current working tree            |

---

## Commit later (icons + unused deps)

The following are **not** part of the main commit sequence. Commit when enabling
icons/icon tooling.

### Working tree (uncommitted)

| File(s)                         | Description                          |
| ------------------------------- | ------------------------------------ |
| `COMMIT_PLAN.md`                | Update with recent SHAs              |
| `package.json`                  | fflate, svgo deps + icons:\* scripts |
| `scripts/_fetch-chain-icons.ts` | Icons fetch script                   |
| `static/networks/*.svg`         | Network icons                        |

### Commit order

After each change: run `deno task install`, then commit `package.json` +
`deno.lock`.

1. **fflate: install** — `devDependencies`: add `"fflate": "^0.8.2"`
2. **svgo: install** — `devDependencies`: add `"svgo": "^4.0.0"`
3. **icons:fetch: setup** — `scripts`: add
   `"icons:fetch": "bun run scripts/_fetch-chain-icons.ts"`
4. **icons:optimize: setup** — `scripts`: add
   `"icons:optimize": "svgo static/networks/*.svg"`
5. **icons: setup** — `scripts`: add
   `"icons": "bun run icons:fetch && bun run icons:optimize"`
6. **Scripts: add chain icons fetch** — `git add scripts/_fetch-chain-icons.ts`
7. **Static: add network icons** — `git add static/networks/*.svg`
