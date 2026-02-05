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
- Creating a bespoke balances UI (reuse `CoinBalances.svelte`).
- Adding new wallet connection flows.

## Data sources (TanStack DB)

- **Balances:** `actor-coins` + `token-list-coins` + stork prices via
  `$/views/CoinBalances.svelte` and `fetchAllBalancesForAddress`.
- **Transactions:** `transactionsCollection` (filter by interop address when
  available; fallback to raw `0x` address when not).
- **Wallet connections module (conditional):** `walletConnectionsCollection` joined
  with `walletsCollection`; match rows where `actors` includes the normalized
  address. **Visibility:** render the module only when at least one such row
  exists.
- **Room/peer connections module (conditional):** `sharedAddressesCollection`
  where `address` (normalized) equals the account address; optionally
  `verificationsCollection` when available. Join with `roomPeersCollection` and
  `roomsCollection` for room name and peer display name. **Visibility:** render
  the module only when at least one matching shared-address (or verification)
  row exists.

## Page layout

- Header with the resolved address:
  - Display interop form when available (chain-aware).
  - Display the raw `0x` address for copy/reference.
- **Balances section:** reuse `CoinBalances.svelte` with `selectedActor` set to the
  normalized `0x` address and `balanceTokens` derived from existing token lists.
- **Transactions section:** render a list of indexed transactions for the
  account. Reuse an existing transaction list component if present; otherwise
  create a minimal `AccountTransactions.svelte` view that reads from
  `transactionsCollection`.
- **Wallet connections module:** list connected wallets that include the account
  (from `walletConnectionsCollection`, match by `actors`). **Show only when** the
  address appears in at least one row of `walletConnectionsCollection` (i.e. the
  address is in some connection’s `actors`). Reuse the same list/card pattern as
  the current account page (wallet name, status, Selected badge); no new
  component required unless a shared component is extracted.
- **Room/peer connections module:** list rooms and peers where this address was
  shared or verified (multiplayer context). **Show only when** the address
  appears in the relevant room DB collections: `sharedAddressesCollection`
  (address equals this account) or, when implemented, `verificationsCollection`
  (address as verified address). Reuse existing room components as much as
  possible: e.g. room link to `/rooms/[roomId]`, peer display name from
  `roomPeersCollection`, verification status from shared-addresses/verifications.
  Content: for each matching shared-address (or verification) row, show room
  name/link, peer who shared it, and verification state (e.g. verified-by count or
  status). Can be a slim list or reuse patterns from `SharedAddresses.svelte` /
  `PeerList.svelte` without embedding the full room UI.

## Navigation

- Nav item **Accounts** (title "Accounts", href `/accounts`, defaultOpen, tag = count of accounts).
- **Flattened** list: one nav item per connected account (wallet accounts and watching accounts), no wallet grouping.
- Each account item: title = short address (`formatAddress`), href = `/account/{interopAddress|0xAddress}`, **tag** = wallet name (e.g. MetaMask) or `Watching`, **icon** = wallet provider icon when available (EIP-6963); watching accounts have no icon.
- Account items link to `/account/{interopAddress|0xAddress}`.

## Acceptance criteria

- [x] `/account/[address]` renders for both interop and raw `0x` addresses.
- [x] The page shows balances using existing `CoinBalances.svelte` and TanStack DB.
- [x] The page shows indexed transactions from `transactionsCollection`.
- [x] The page lists wallet connections that include the account.
- [ ] **Wallet connections module** is shown **only when** the address appears in
  `walletConnectionsCollection` (i.e. in some connection’s `actors`); otherwise
  the section is omitted. Reuse existing list/card pattern.
- [ ] **Room/peer connections module** is shown **only when** the address appears
  in `sharedAddressesCollection` (or `verificationsCollection` when implemented).
  Content: room link, peer display name, verification state; reuse patterns from
  `SharedAddresses.svelte` / `PeerList.svelte` / room collections.
- [x] Accounts nav items (flattened, with icon and tag) link to the account route.
- [x] No direct RPC fetches are introduced in the account page (TanStack DB only).

## TODOs

- TODO: Identify an existing transaction list component to reuse; if none,
  create `AccountTransactions.svelte`.
- TODO: Define the final display format for interop vs raw address in the header.
- TODO: Implement conditional wallet connections module (hide section when no
  connections for this address).
- TODO: Implement room/peer connections module with conditional visibility and
  reuse of room components.

## Status

Complete for initial implementation. Spec updated: wallet connections and
room/peer connections as conditional modules (show only when address is in the
relevant collections); room/peer module to reuse existing room components.

## Output when complete

`DONE`
