# Commit Plan (atomic, topological)

## Phase 1: Foundation (styles, docs, API, data)

| # | Message | Files | Deps |
|---|---------|--------|------|
| 1 | styles: data-text=muted, bits-ui select/combobox, primary button, card | bits-ui.css, components.css | — |
| 2 | docs: specs and history use data-text=muted and gap tokens | history/*.md, specs/*.md (7) | — |
| 3 | api(transfers-logs): batched block timestamp fetch with concurrency limit | src/api/transfers-logs.ts | — |
| 4 | data: TransferEvents cache + in-flight, TransferGraphs upsert from events | TransferEvents.ts, TransferGraphs.ts | 3 |
| 5 | constants: LiquidityAction, WETH + getBridgeCoins, bridge protocol ids | actions.ts, coins.ts, protocols.ts | — |

## Phase 2: Protocol selection + coins/networks

| # | Message | Files | Deps |
|---|---------|--------|------|
| 6 | protocol: lib/protocols, ProtocolInput, NetworkName, CoinTransfers; remove ProtocolCardSelect | lib/protocols/, ProtocolInput.svelte, NetworkName.svelte, CoinTransfers.svelte, rm ProtocolCardSelect.svelte | 5 |
| 7 | nav + routes: coins, networks, stork; BridgeProtocolFieldset + Action; coin page | navigationItems.svelte.ts, routes/coins/, routes/networks/, routes/test/stork/, session/BridgeProtocolFieldset.svelte, views/.../BridgeProtocolFieldset.svelte, session/Action.svelte, coin/[symbol]/+page.svelte | 6 |

## Phase 3: Markup + UI sweep

| # | Message | Files | Deps |
|---|---------|--------|------|
| 8 | markup: data-text=muted, gap-2, data-column throughout | All remaining modified src (components, routes, views) | 1, 7 |
| 9 | chore: pnpm-lock | pnpm-lock.yaml | — |

## Completed
| # | SHA |
|---|-----|
| 1 | 7ca7b2d |
| 2 | 50fafa7 |
| 3 | 737f45d |
| 4 | db8915c |
| 5 | e955c31 |
| 6 | 8f79493 |
| 7 | 344554f |
| 8 | d90877e |
| 9 | 9acd2c6 |
| 10 | 022b72b |
| 11 | 2370a3b |
| 12 | 994eeab |
| 13 | e74bbdb |
| 14 | 9816c46 |
| 15 | 1236bfd |
| 16 | e241ae6 |
| 17 | e01ec84 |

## Commit later / ignore
- (none)
