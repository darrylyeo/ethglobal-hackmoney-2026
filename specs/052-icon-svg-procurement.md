# Spec 052: Icon SVG procurement

Unify and generify SVG procurement for chain, coin, and API provider icons. The
pipeline reuses one schema and script to fetch, normalize, and store icons
locally. Types and constants follow spec 045 (schema + constants preferences)
and live in `src/constants/` alongside other domain constants (cf. spec 001,
042).

## Implementation

### Constants and schema (src/constants/)

Per spec 045: types live alongside constants in `src/constants/`; minimal
schema; one array per type; reuse existing domain types.

- **`src/constants/icons.ts`**
	- **Types:** `IconTarget` (`'chain' | 'coin' | 'provider'`), `IconKind` enum
	  (Logo, Wordmark, LogoAndWordmark), `IconStyle` (string), `FetchType` (discriminant
	  union: `url` | `png` | `zip` with respective fields), `IconFetchItem` (target, id,
	  kind?, style?, fetch), `IconAlias` (target, fromId, toId).
	- **Reuse:** `id` for chains uses `ChainId` (from `networks.ts`); coin/provider id
	  as string (align with `DataSource` or token list keys where applicable).
	- **Path helpers:** deterministic filename from id/kind/style; `chainIconPath`,
	  `coinIconPath`, `providerIconPath` resolving to `/icons/chains|coins|providers/{filename}`.
	- **Canonical arrays:** one array per target — e.g. `coinIconFetchItems`, `providerIconFetchItems`
	  with `as const satisfies readonly IconFetchItem[]`; chain icon items remain in
	  `scripts/_fetch-chain-icons.ts` as the canonical chain-only source (size/source).
	- No duplicated type definitions; no separate schema layer outside constants.

### Output structure

- Icons under `static/icons/` with subdirectories: `chains/`, `coins/`, `providers/`.
- Naming: same suffix rule for kind/style across targets (e.g. `{id}.svg`, `{id}-wordmark.svg`).
- Fetcher supports reusing a default SVG for testnet/alias targets.

### Sources and registries

- Coin and provider icon fetch items live in `src/constants/icons.ts` (or a single
  registries export therefrom). Chain icon items stay in the script.
- Prefer official brand assets or token list sources over block explorers.
- Document source (URL/repo) in comments per entry.

### Script behavior

- `scripts/_fetch-icons.ts` imports types and path helpers from `src/constants/icons.ts`,
  chain items (and testnet alias list) from `scripts/_fetch-chain-icons.ts`, coin/provider
  arrays from constants; writes to `static/icons/{chains|coins|providers}/`.
- PNG wrapping when SVG unavailable; ZIP cache reused across assets.
- Summary of written files and skips, grouped by target.

### Integration

- UI resolves chain/coin/provider icons via the path helpers in `src/constants/icons.ts`
  and uses local `static/icons/*` assets only (no remote URLs for these).

## Acceptance criteria

- [x] A shared icon fetch schema exists and is used for chains, coins, and providers.
- [x] A generic fetch script writes assets under `static/icons/*`.
- [x] Coin and provider icon registries exist with documented sources.
- [x] Testnet/provider alias reuse is supported by the fetcher.
- [x] UI icon rendering relies on local static assets for chains/coins/providers.
- [x] `deno run -A scripts/_fetch-icons.ts` completes without errors and produces SVGs in all three directories.

## Testing

- `deno run -A scripts/_fetch-icons.ts`

## Status

Complete. All icon data in constants: `src/constants/icons.ts` (types, path helpers, coinIconFetchItems, providerIconFetchItems); `src/constants/chain-icon-fetch-items.ts` (chainIconFetchItems, chainIconAliases). Scripts `_fetch-icons.ts` and `_fetch-chain-icons.ts` import from constants. Output under `static/icons/chains|coins|providers/`; UI uses `/icons/chains/`. Aligned with spec 045/001/042.

## Output when complete

`DONE`
