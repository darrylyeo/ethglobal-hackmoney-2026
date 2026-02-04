# Spec 005: Wallet Provider & Balance Querying

Context component providing wallet connection, network toggle, and balance
querying for connected accounts.

## Requirements

1. **WalletProvider context component** providing:
   - Wallet connect button (EIP-6963 discovery)
   - Testnet/Mainnet toggle switch
   - Children snippet receiving wallet state

2. **Collections for account data:**
   - `Actor` – unique account address on any chain (`chainId` + `address`)
   - `ActorCoin` – balance of a coin for an actor

3. **Bridge page integration:**
   - Query USDC balances across all chains when wallet connects
   - Display balances in a grid

4. **Use Bits UI** for Switch, Popover, Button components

## Implementation

### Wallet management (`src/views/Wallets.svelte`)

Wallet management using TanStack DB collections:

- `walletsCollection` – discovered EIP-6963 wallets
- `walletConnectionsCollection` – connection state per wallet
- Multi-wallet support with selection

### Bridge settings (`src/state/bridge-settings.svelte.ts`)

Persisted settings including testnet/mainnet toggle managed via `bridgeSettingsState`.

### Collections

`src/collections/actors.ts`:

```typescript
type Actor = {
  chainId: number;
  address: `0x${string}`;
};
```

`src/collections/actor-coins.ts`:

```typescript
type ActorCoin = {
  chainId: number;
  address: `0x${string}`;
  coinAddress: `0x${string}`;
  coinSymbol: string;
  coinDecimals: number;
  balance: bigint;
  isLoading: boolean;
  error: string | null;
};
```

### Bridge page

- Wrap content in
  `<WalletProvider>{#snippet children(wallet)}...{/snippet}</WalletProvider>`
- When `wallet.address` is set, call
  `fetchAllBalancesForAddress(wallet.address)`
- Display balances grid with chain name and formatted balance

## Acceptance criteria

### Wallet components

- [x] `Wallets.svelte` exists in `src/views/`
- [x] Uses TanStack DB collections for wallet and connection state
- [x] Multi-wallet support with selection
- [x] Testnet/mainnet toggle via `bridgeSettingsState`
- [x] Connect button shows discovered EIP-6963 wallets
- [x] Connected state shows address and disconnect option

### Collections

- [x] `actors.ts` defines `Actor` type and `actorsCollection`
- [x] `actor-coins.ts` defines `ActorCoin` type and `actorCoinsCollection`
- [x] `fetchActorCoinBalance()` fetches single token balance via RPC
- [x] `fetchAllBalancesForAddress()` fetches all USDC balances across chains

### Bridge page integration

- [x] Bridge page uses `Wallets.svelte` for wallet management
- [x] `Balances.svelte` displays USDC balances per chain
- [x] Balances fetched automatically when wallet connects
- [x] Balances displayed in grid with chain name and amount
- [x] Loading states shown while fetching
- [x] Errors displayed per-chain if RPC fails

### E2E tests

- [x] Test: Network toggle switches between Mainnet/Testnet label
- [x] Test: Connect wallet button opens popover
- [x] Test: After connection, address displays in header (manual / skipped in CI)
- [x] Test: Disconnect button clears connection (manual / skipped in CI)
- [x] Test: Balances section appears after connection (manual / skipped in CI)

## Testing approach

### Unit tests (`src/collections/actor-coins.spec.ts`)

```typescript
Deno.test("actorCoinKey generates correct key", () => {
  const key = actorCoinKey(1, "0xabc...", "0xusdc...");
  assertEquals(key, "1-0xabc...-0xusdc...");
});

Deno.test("formatBalance formats correctly", () => {
  // 1000000 with 6 decimals = 1.0000
  assertEquals(formatBalance(1000000n, 6), "1.0000");
  // 1234567890 with 6 decimals = 1234.5678
  assertEquals(formatBalance(1234567890n, 6), "1234.5678");
});
```

### E2E tests (`e2e/wallet.test.ts`)

```typescript
test("network toggle switches label", async ({ page }) => {
  await page.goto("/bridge");
  await expect(page.locator("[data-wallet-network-label]")).toHaveText(
    "Mainnet",
  );
  await page.click("[data-wallet-network-switch]");
  await expect(page.locator("[data-wallet-network-label]")).toHaveText(
    "Testnet",
  );
});

test("connect wallet button opens popover", async ({ page }) => {
  await page.goto("/bridge");
  await page.click("[data-wallet-connect-trigger]");
  await expect(page.locator("[data-wallet-popover]")).toBeVisible();
});

test("balances display after wallet connection", async ({ page }) => {
  // Requires wallet extension or mock
  await page.goto("/bridge");
  // Mock or inject wallet connection...
  await expect(page.locator("[data-balances-grid]")).toBeVisible();
  await expect(page.locator("[data-balance-item]")).toHaveCount(9); // 9 chains
});
```

### Manual testing

1. Open `/bridge` in browser
2. Verify "Mainnet" label shown, toggle switches to "Testnet"
3. Click "Connect Wallet" - popover shows discovered wallets
4. Connect with MetaMask or similar
5. Verify address shows in header (e.g., `0x1234…5678`)
6. Verify balances grid appears with all 9 chains
7. Verify loading states show while fetching
8. Click "Disconnect" - verify address clears, balances hide

## Status

Complete. `Wallets.svelte` in `src/views/` with TanStack DB collections
(`walletsCollection`, `walletConnectionsCollection`).
`actorsCollection` and `actorCoinsCollection` for balances.
`bridgeSettingsState` for testnet/mainnet toggle. E2E tests in
`e2e/wallet.test.ts`: network toggle and connect-popover pass; address,
disconnect, and balances tests skipped in CI (manual verification).

## Output when complete

`DONE`
