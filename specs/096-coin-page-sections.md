# Spec 096: Coin page sections (Contracts, Activity)

Restructure the coin page into named sections: **Contracts** and **Activity**. Activity consolidates data fetching and query logic (TanStack DB) and contains the transfer visualization plus three sub-views: Transfers, Bridge transfers, Swaps.

## Scope

- **Contracts section:** View component `CoinContracts` (section title "Contracts") listing token contracts per chain; reuse/update `TokenContracts`.
- **Activity section:** View component `CoinActivity` (section title "Activity") that:
  - Owns all TanStack DB queries and fetch logic for the selected coin + period (transfer events, transfer graph).
  - Renders the period nav and the transfer graph visualization (`LiveTransfers`) inside the section.
  - Contains three child views: `CoinTransfers`, `CoinBridgeTransfers`, `CoinSwaps`.
- **CoinTransfers:** Renders the list of transfer events (data supplied by parent / same collection).
- **CoinBridgeTransfers:** Renders bridge-related transfers (filtered view or empty state until enrichment exists).
- **CoinSwaps:** Renders swap-related activity (filtered view or empty state until enrichment exists).

## Data

- TanStack DB: `transferEventsCollection`, `transferGraphsCollection`; fetch via `fetchTransferEvents`, `ensureTransferEventsForPlaceholders`. All live queries and effects live in `CoinActivity`; child views receive data as props or subscribe to the same collections without duplicating fetch logic.
- Bridge/swaps: No schema yet; views show empty state or "No bridge transfers" / "No swaps" until event classification or separate collections exist.

## Conventions

- Follow `AccountContracts` pattern: section = `<details data-card><summary><h3>Section name</h3>...</summary>...</details>`.
- Use `EntityList` / `ItemsListView` for lists where applicable (see Spec 088, 064).
- Svelte 5: `$props`, `$state`, `$derived`, `$effect`; `<svelte:boundary>` not `{#await}`.

## Acceptance criteria

- [x] Coin page shows two sections: "Contracts" and "Activity".
- [x] `CoinContracts` view exists; section title is "Contracts"; content is token contracts list (reuse TokenContracts with `sectionTitle` prop).
- [x] `CoinActivity` view exists; section title is "Activity"; contains period nav, transfer graph (LiveTransfers), and three sub-views.
- [x] All transfer-related TanStack DB queries and fetch effects live in CoinActivity (single place).
- [x] `CoinTransfers` displays the transfer events list (data passed from CoinActivity).
- [x] `CoinBridgeTransfers` and `CoinSwaps` exist and render (empty state; bridge/swap enrichment not yet available).
- [x] Coin page uses CoinContracts and CoinActivity; no duplicate query/fetch logic on the page.

## Status

Complete. Coin page restructured: CoinContracts (section "Contracts"), CoinActivity (section "Activity") with TanStack DB queries/fetch, LiveTransfers, CoinTransfers (presentational), CoinBridgeTransfers and CoinSwaps (stubs).
