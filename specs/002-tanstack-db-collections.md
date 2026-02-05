# Spec 002: TanStack DB collections

Collections to normalize chain, token, wallet, and bridge data.

## Implementation

`src/lib/db/query-client.ts`:

- `queryClient`: shared `QueryClient` instance

### Core collections

`src/collections/networks.ts`:

- `normalizeNetwork(entry)`: identity transform `{ id, name, type }`
- `networksCollection`: TanStack DB collection from `networks` constant

`src/collections/coins.ts`:

- `normalizeCoin(entry)`: identity transform `{ chainId, address, symbol, decimals }`
- `coinsCollection`: TanStack DB collection from `ercTokens` constant

### Wallet collections

`src/collections/wallets.ts`:

- `walletsCollection`: discovered EIP-6963 wallet providers

`src/collections/wallet-connections.ts`:

- `walletConnectionsCollection`: connection state per wallet

`src/collections/actors.ts`:

- `actorsCollection`: connected wallet addresses (actors)

`src/collections/actor-coins.ts`:

- `actorCoinsCollection`: token balances per actor per chain

`src/collections/actor-allowances.ts`:

- `actorAllowancesCollection`: ERC20 approval state per actor/spender

### Bridge collections

`src/collections/bridge-routes.ts`:

- `bridgeRoutesCollection`: LI.FI route quotes with fetching state

`src/collections/transactions.ts`:

- `transactionsCollection`: bridge transaction history

## Acceptance criteria

- [x] `queryClient` exported from `src/lib/db/query-client.ts`.
- [x] `networksCollection` in `src/collections/networks.ts`.
- [x] `coinsCollection` in `src/collections/coins.ts`.
- [x] `walletsCollection` in `src/collections/wallets.ts`.
- [x] `walletConnectionsCollection` in `src/collections/wallet-connections.ts`.
- [x] `actorsCollection` in `src/collections/actors.ts`.
- [x] `actorCoinsCollection` in `src/collections/actor-coins.ts`.
- [x] `actorAllowancesCollection` in `src/collections/actor-allowances.ts`.
- [x] `bridgeRoutesCollection` in `src/collections/bridge-routes.ts`.
- [x] `transactionsCollection` in `src/collections/transactions.ts`.
- [x] Unit tests for collection normalizers (networks.spec.ts, coins.spec.ts, actors.spec.ts, actor-coins.spec.ts).

## Status

Complete. Core collections for networks/coins, wallet discovery and connection,
actor balances and allowances, bridge routes, and transaction history.
Re-verification 2026-02-05 (PROMPT_build execute one spec, no incomplete specs):
re-verified 002; queryClient in query-client.ts; networksCollection, coinsCollection,
walletsCollection, walletConnectionsCollection, actorsCollection, actorCoinsCollection,
actorAllowancesCollection, bridgeRoutesCollection, transactionsCollection in
src/collections; networks.spec.ts, coins.spec.ts, actors.spec.ts, actor-coins.spec.ts
present; test:unit 44 Deno + 101 Vitest passed.

## Output when complete

`DONE`
