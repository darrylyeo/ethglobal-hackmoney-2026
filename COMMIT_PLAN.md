# Atomic commit plan

## Completed (this run)

| # | SHA      | Message |
|---|----------|---------|
| 1 | 2b79fa8  | Env: e2e TEVM RPC, Stork token; env.d.ts |
| 2 | 5ab7b4b  | Voltaire: block timestamp, EthTransaction, getLogs |
| 3 | 0577924  | Data: Block, ChainTransaction, Trace, $EntityType |
| 4 | 2fa7329  | Collections: blocks, chain-transactions |
| 5 | 62c491c  | Format: formatWei, formatGas, formatGwei |
| 6 | 176b1ee  | Constants: DataSource.Llm |
| 7 | abc2c3d  | Explain: Llm* abstraction, Explain* types |
| 8 | d3d293e  | E2E: tevm config and client |
| 9 | a3773d5  | Vite: preview port, dev allowedHosts |
| 10 | c7caff6  | Network: Block, Event, Network, Trace, Transaction |
| 11 | 7f790ec  | Components: section spacing |
| 12 | 05011b1  | Routes, views, layout: section spacing and usage |
| 13 | dbe4463  | Styles: bits-ui |
| 14 | 389bfdf  | Specs: 051, 063 |

## Completed (previous run)

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
| 12 | 09ecf8f  | chore: update commit plan |

## Commit later / uncommitted

- `.cursor/agents/`, `.cursor/rules/`, `.cursor/skills/`
- `history/2026-02-05-build-reverify-039-e2e-partial.md`
- `specs/065-external-api-cache-live-queries.md`, `specs/066-dialogue-tree-data-model.md`, `specs/067-agent-session-ui.md`
- `src/collections/dialogue-trees.ts`, `src/collections/dialogue-turns.ts`
- `src/components/EntityRefInput.svelte`, `EntityReferenceInput.svelte`, `PromptInput.svelte`, `Tabs.svelte`, `src/components/agent/`
- `src/constants/entity-ref-patterns.ts`, `src/constants/opencode-zen.ts`
- `src/data/DialogueTree.ts`, `DialogueTurn.ts`, `EntityRef.ts`
- `src/lib/dialogue.ts`, `entity-suggestions.ts`, `prompt-value.ts`
- `src/routes/agents/`, `src/routes/api/llm/`

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
