# Spec 116: Coins constants restructure

Split coin identity (symbol, color) from per-chain/per-contract instances. Introduce `CoinId` and a single `Coin` type for the canonical list; move all native and ERC20 instances into `coin-instances.ts` with `$id`-based types and Map.groupBy lookups.

## Scope

- **coins.ts:** Holds only canonical “coin” identity: enum `CoinId`, type `Coin` (id, symbol, color), `coins` array, `coinById` lookup. No chain or contract addresses.
- **coin-instances.ts:** New file holding all on-chain representations: `NativeCurrency` and `Erc20Token` with `$id` (network or contract), single `coinInstances` array (native for every network + all ERC20 entries), and Map.groupBy by network for instances, native only, and ERC20 only.

## Definitions

- **Coin (canonical):** A logical asset (e.g. ETH, USDC) identified by `CoinId`; has `symbol` and `color` for UI. No chain/address.
- **Coin instance:** A concrete representation on a chain: either a network’s native currency or an ERC20 contract. Has a stable `$id` (Network$Id or Contract$Id).

## Implementation

### `src/constants/coins.ts`

- `enum CoinId { ETH, USDC, USDT, ... }` — extend with symbols that have colors (match current `CoinColorSymbol` set or subset used by app).
- `type Coin = { id: CoinId; symbol: string; color: string }`.
- `export const coins: readonly Coin[] = [ ... ] as const satisfies Coin[]` — one entry per `CoinId` with symbol and hex color.
- `export const coinById = Object.fromEntries(coins.map((c) => [c.id, c]))` (typed as `Record<CoinId, Coin>` or equivalent).
- Remove from coins.ts: `CoinType`, `NativeCurrency`, `Erc20Token`, `Coin`, `CoinSymbol`, `coinSymbolEntries`, `COIN_SYMBOLS`, `CoinColorSymbol`, `coinColorEntries`, `coinColorBySymbol`, all ERC20 entry arrays, `ercTokens`, `ercTokensBySymbolByChainId`, `coinSymbolCoinEntries`, `coinBySymbol`, `bridgeCoinsByChainId`. Re-export or define in coin-instances.ts as needed.

### `src/constants/coin-instances.ts`

- Types (and re-exports where used elsewhere):
  - `enum CoinInstanceType { NativeCurrency, Erc20Token }`.
  - `type NativeCurrency = { type: CoinInstanceType.NativeCurrency; $id: Network$Id; name?: string; symbol: string; decimals: number; icon?: Media }` (and address if needed: use zero address or omit; align with current `NativeCurrency` usage).
  - `type Erc20Token = { type: CoinInstanceType.Erc20Token; $id: Contract$Id; name?: string; symbol: string; decimals: number; icon?: Media }`. Do not define a separate Erc20Token$Id; use `Contract$Id` from `src/data/Contract.ts` for identity.
  - `type CoinInstance = NativeCurrency | Erc20Token`.
- **Native instances:** Build one `NativeCurrency` per network using `networksByChainId` / `networks`: for each network, push `{ type: CoinInstanceType.NativeCurrency, $id: { chainId: network.chainId }, symbol: network.nativeCurrency.symbol, decimals: 18, name?: network.nativeCurrency.name }` (and address `0x0` if required by type).
- **ERC20 instances:** Move current ERC20 token entries (USDC per chain, WETH, etc.) into `Erc20Token` shape with `$id: { $network: { chainId }, address }`, plus symbol, decimals, name?, icon?.
- `const coinInstances: readonly CoinInstance[] = [ ...nativeEntries, ...erc20Entries ] as const satisfies readonly CoinInstance[]`.
- Helper for groupBy key: `chainIdForInstance(i: CoinInstance) => i.type === CoinInstanceType.NativeCurrency ? i.$id.chainId : i.$id.$network.chainId`.
- `coinInstanceByNetwork = Map.groupBy(coinInstances, chainIdForInstance)`.
- `nativeCurrencyByNetwork = Map.groupBy(coinInstances.filter((i) => i.type === CoinInstanceType.NativeCurrency), (i) => i.$id.chainId)`.
- `erc20TokenByNetwork = Map.groupBy(coinInstances.filter((i) => i.type === CoinInstanceType.Erc20Token), (i) => i.$id.$network.chainId)`.
- Export: `coinInstances`, `coinInstanceByNetwork`, `nativeCurrencyByNetwork`, `erc20TokenByNetwork`, and types `CoinInstance`, `NativeCurrency`, `Erc20Token`, `CoinInstanceType`. Provide helpers/lookups equivalent to current `ercTokensBySymbolByChainId` and `bridgeCoinsByChainId` (e.g. by chainId and optionally by symbol) derived from these maps.

### `src/data/Coin.ts`

- Update to reference the new types: `Coin$Id` can remain for “coin instance” identity (network + address for native vs contract). Align `CoinEntry` with `CoinInstance` (Erc20Token) where it represents a contract-based coin; or define `CoinInstance$Id` as union of Network$Id | Contract$Id and use in coin-instances.

### Migration / consumers

- Replace `coinBySymbol` usage with `coinById` keyed by `CoinId` where a canonical coin is needed; or add `coinIdBySymbol` / keep a small symbol→CoinId map in coins.ts if needed.
- Replace `coinColorBySymbol` with `coinById[coinId].color` (or `coinBySymbol` → derive from coins + symbol if symbol remains the key in some flows). Spec 086 (CoinIcon) uses `coinColorBySymbol[symbol]` — update to use `coins` / `coinById` keyed by coin id or symbol as chosen.
- Replace `bridgeCoinsByChainId` with `coinInstanceByNetwork.get(chainId)` (or array from map) and ensure type is `CoinInstance[]` where used.
- Replace `ercTokens` and `ercTokensBySymbolByChainId` with `erc20TokenByNetwork` and derived symbol lookups from coinInstances.
- Ensure `CoinSymbol`-based logic (e.g. default-watched-entities) uses `CoinId` and/or symbol from `Coin` where appropriate.

## Acceptance criteria

- [ ] `coins.ts` exposes only `CoinId` enum, `Coin` type, `coins` array (`as const satisfies Coin[]`), and `coinById` (Object.fromEntries from coins).
- [ ] `coin-instances.ts` defines `CoinInstanceType`, `NativeCurrency`, `Erc20Token`, `CoinInstance`; `NativeCurrency.$id` is Network$Id; `Erc20Token.$id` is Contract$Id.
- [ ] `coinInstances` includes one native currency per network (from networks) and all current ERC20 token entries; typed `as const satisfies readonly CoinInstance[]`.
- [ ] `coinInstanceByNetwork`, `nativeCurrencyByNetwork`, and `erc20TokenByNetwork` are Map.groupBy results keyed by chainId.
- [ ] No duplicate coin/instance logic remains in `coins.ts`; native data comes from networks and lives in `coinInstances`.
- [ ] Consumers updated to use new coins + coin-instances (coinById, coinInstanceByNetwork, etc.) and tests pass.

## References

- Spec 001 (constants and networks): networks, networksByChainId, ChainId.
- Spec 086 (NetworkIcon, CoinIcon): coin color and symbol; migrate to `coins` / `coinById`.
- `src/data/Contract.ts`: Contract$Id. `src/data/Network.ts`: Network$Id.

## Status

INCOMPLETE.
