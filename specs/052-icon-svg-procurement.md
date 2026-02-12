# Spec 052: Asset (icon) procurement

Unify and generify SVG procurement for chain, coin, and brand assets. All sources
and discovery documentation live in `src/constants/assets.ts`. One sync script
downloads/unpacks/optimizes only sources not yet synced (like a package manager).
Types follow spec 045 (cf. spec 001, 042).

## Implementation

### Constants and schema (src/constants/assets.ts)

- **Types:** `AssetSubject` (Network, Coin, Brand), `AssetKind` (Logo, Wordmark, LogoAndWordmark),
  `AssetStyle` (string), `FetchType` (Url | Png | Zip), `AssetSource` (subject, id, kind?, style?, fetch),
  `AssetAlias` (subject, fromId, toId).
- **IDs:** chains use `ChainId`; coins and brands use string (lowercase).
- **Helpers:** `assetFilename(id, kind?, style?)`, `assetSuffix()`, `isDefaultAsset()`.
- **Sources:** `chainAssetSources`, `chainAssetAliases`, `coinAssetSources`, `providerAssetSources`;
  all with documented source comments (discovery: chain registries, brand kits, token lists, Simple Icons, etc.).
- **Discovery:** Documented in file header and per-entry comments; fetch URL is source of truth.

### Output structure

- Assets under `src/assets/` with subdirectories: `networks/`, `coins/`, `providers/` (importable; bundled via glob).
- Naming: `{id}.svg` or `{id}-{suffix}.svg`. Alias copy: testnet reuses mainnet default SVG when missing.

### Sync script

- **`scripts/_sync-assets.ts`:** Imports all sources from `src/constants/assets.ts`; writes to `src/assets/{networks|coins|providers}/`.
- Only syncs sources not yet present on disk; skips existing files (package-manager style).
- Optional CLI arg `chain` | `coin` | `provider` to limit to one subject.
- PNG wrapping when SVG unavailable; ZIP fetched once per URL and cached in memory.
- Logs OK/SKIP/COPY per file; final count by directory.

### Agent workflow (dedicated)

When adding or replacing icons manually (outside `_sync-assets.ts`), agents must follow this sequence:

1. **Source provenance first:** add/update the matching entry in `src/constants/assets.ts` (`chainAssetSources`, `coinAssetSources`, or `providerAssetSources`) with:
   - canonical `id` used as filename stem
   - `fetch.url` pointing to the authoritative source URL
   - a concise per-entry comment naming source origin (official brand kit/site, registry, token list, etc.)
2. **Store locally only:** save icon files under `src/assets/{networks|coins|providers}/`; do not use remote URLs in UI runtime.
3. **Optimize SVGs:** run `svgo` on every newly added/updated SVG (either via sync script or direct `svgo` invocation).
4. **Wire imports inline:** use `(await import('$/assets/.../*.svg?url')).default` at usage sites (no path builder helpers).
5. **Verify:** confirm no lints in touched files and ensure final icons render from local assets.

### URL resolution

- Inline `await import('path to file')`: every constant that needs an icon reference uses `(await import('$/assets/.../file.svg?url')).default` at that site. No helper string builders.
- Network config: `src/constants/networks.ts` uses top-level `await import(...)` in each `networkConfigs` entry that has an `icon`. Layout/views use `<NetworkIcon chainId={...} />` or `config.icon` / `networkConfigsByChainId[id]?.icon` where a raw URL is needed (see Spec 086).
- Coins/providers: layout and architecture graph use `<CoinIcon src={...} symbol={...} />` or top-level `await import(...)` for each coin/provider icon (Spec 086). Brand colors for icon backgrounds come from `src/constants/colors.ts` (`networkColorByChainId`, `coinColorBySymbol`).

## Acceptance criteria

- [x] Shared schema (AssetSubject, AssetSource, FetchType) used for chains, coins, and brands.
- [x] All sources and discovery documentation in `src/constants/assets.ts`.
- [x] Sync script writes to `src/assets/`, skips existing, runs svgo on new SVGs.
- [x] Manual icon updates follow the dedicated agent workflow (source docs in `assets.ts`, local asset storage, svgo optimization, inline `?url` imports).
- [x] Chain alias copy (testnet/mainnet reuse) supported.
- [x] UI uses inline static imports (?url) for icons; no remote asset URLs, no path builder helpers.

## Testing

- `deno run -A scripts/_sync-assets.ts` (all) or `... _sync-assets.ts coin`, etc.

## References

- Spec 086 (Icon subicon, NetworkIcon, CoinIcon): `<NetworkIcon>` and `<CoinIcon>` consume config icon URLs and `src/constants/colors.ts` for backgrounds.

## Status

Complete. Schema and all sources in `src/constants/assets.ts`; URL resolution was in `src/lib/assets/urls.ts` (removed; inline await import now). Single script `_sync-assets.ts` syncs only missing assets; optional subject arg. Network/coin UI icons use NetworkIcon/CoinIcon (Spec 086) with colors from `colors.ts`.
