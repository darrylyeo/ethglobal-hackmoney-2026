# Spec 059: Account pages

Add an account detail route that renders balances, indexed transactions, and
wallet connections for a given address. All data is sourced from TanStack DB,
reusing existing components where possible.

## Scope

- New route: `/account/[address]` where `address` is either:
  - an interop address (e.g. `@eip155:1#...`) or
  - a raw `0x` address (no chain context)
- Normalize the route param into:
  - `interopAddress` (when `chainId` is present) and
  - canonical `0x` address (for legacy/no-chain inputs)
- Render balances, indexed transactions, and wallet connections for the account
  using TanStack DB collections and existing UI components.
- Wire **Accounts** nav items to the account page links. The Accounts list page (wallet connections, connect UI) is at **`/accounts`**; `/wallets` redirects 302 to `/accounts`.

## Non-goals

- Adding new indexers or RPC fetches for transactions.
- Creating a bespoke balances UI (reuse `Balances.svelte`).
- Adding new wallet connection flows.

## Data sources (TanStack DB)

- **Balances:** `actor-coins` + `token-list-coins` + stork prices via
  `$/views/Balances.svelte` and `fetchAllBalancesForAddress`.
- **Transactions:** `transactionsCollection` (filter by interop address when
  available; fallback to raw `0x` address when not).
- **Wallet connections:** `walletConnectionsCollection` joined with
  `walletsCollection` for wallet names/icons; match by `actors` that include the
  normalized address.

## Page layout

- Header with the resolved address:
  - Display interop form when available (chain-aware).
  - Display the raw `0x` address for copy/reference.
- **Balances section:** reuse `Balances.svelte` with `selectedActor` set to the
  normalized `0x` address and `balanceTokens` derived from existing token lists.
- **Transactions section:** render a list of indexed transactions for the
  account. Reuse an existing transaction list component if present; otherwise
  create a minimal `AccountTransactions.svelte` view that reads from
  `transactionsCollection`.
- **Connections section:** list connected wallets that include the account,
  with connection status and selected indicator if applicable.

## Navigation

- Nav item **Accounts** (title "Accounts", href `/accounts`, defaultOpen, tag = count of accounts).
- **Flattened** list: one nav item per connected account (wallet accounts and watching accounts), no wallet grouping.
- Each account item: title = short address (`formatAddress`), href = `/account/{interopAddress|0xAddress}`, **tag** = wallet name (e.g. MetaMask) or `Watching`, **icon** = wallet provider icon when available (EIP-6963); watching accounts have no icon.
- Account items link to `/account/{interopAddress|0xAddress}`.

## Acceptance criteria

- [x] `/account/[address]` renders for both interop and raw `0x` addresses.
- [x] The page shows balances using existing `Balances.svelte` and TanStack DB.
- [x] The page shows indexed transactions from `transactionsCollection`.
- [x] The page lists wallet connections that include the account.
- [x] Accounts nav items (flattened, with icon and tag) link to the account route.
- [x] No direct RPC fetches are introduced in the account page (TanStack DB only).

## TODOs

- TODO: Identify an existing transaction list component to reuse; if none,
  create `AccountTransactions.svelte`.
- TODO: Define the final display format for interop vs raw address in the header.

## Status

Complete.

## Output when complete

`DONE`
