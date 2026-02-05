# Spec 054: Interop addresses across constants, entity ids, and drag data

Integrate `@wonderland/interop-addresses` (and the address standards it
implements) to standardize address formatting, parsing, and transport across
constants, entity identifiers, and drag payloads.

## Scope

- Add `@wonderland/interop-addresses` to runtime dependencies.
- Define interop address helpers and constants in `src/constants/`.
- Normalize all address-bearing entity ids to include an interop address form
  alongside raw `0x` addresses and chain identifiers.
- Update intent drag payloads to carry interop addresses where they include
  address + chain context.
- Keep interoperability for existing `0x` address-only code paths.

## Non-goals

- Rewriting non-address identifiers (room ids, session ids, etc.).
- Changing on-chain execution or signing behavior beyond formatting/transport.
- Introducing new chains or tokens solely for this change.

## Acceptance criteria

### Dependencies + constants

- [x] `@wonderland/interop-addresses` is added to `package.json` dependencies.
- [x] A constants module exposes interop address helpers and any shared
  formatting config used in the app.
- [x] Constants that represent addresses (or include chain + address pairs)
  offer a derived interop-address representation.

### Entity ids

- [x] Every address-bearing `$id` type (e.g. Actor, Wallet, ActorCoin, Token
  list coin, allowances) includes an interop-address field derived from
  chain + address.
- [x] The app stores both canonical `0x` addresses and interop addresses
  (no loss of raw data).
- [x] Any entity id equality or lookups that compare address + chain use the
  interop format or a shared normalizer to avoid mixed-format mismatches.

### Drag payloads

- [x] Intent drag payloads include interop-address values whenever the payload
  contains an address + chain context.
- [x] Drag data parsing accepts both legacy `0x`-only payloads and new
  interop-address payloads, preferring interop when both are present.
- [x] Drag payloads remain JSON-serializable without introducing custom
  prototypes or classes.

### Validation

- [x] Unit tests cover interop address formatting/parsing for at least one
  actor entity and one token/coin entity id.
- [x] Intent drag payload tests verify round-tripping interop address data
  alongside existing fields.

## Status

Complete. `@wonderland/interop-addresses` in dependencies; `src/constants/interop.ts` with toInteropName, toInteropHex, fromInteropBinary, interopFormatConfig. Actor, ActorCoin, TokenListCoin, ActorAllowance, Coin $id types include optional interopAddress; collections set it on insert/upsert. Intent drag uses withInteropAddress in setIntentDragData; getIntentDragPayload accepts legacy and interop payloads; resolve-intent uses interop (and tokenInteropAddress) for equality. setActorAllowance uses allowanceKeyParts and sets interopAddress. Unit tests: interop.spec.ts (actor + token/coin formatting), drag.spec.ts (round-trip and legacy). Re-verification 2026-02-05 (PROMPT_build): all acceptance criteria confirmed; test:unit 41 Deno + 101 Vitest passed. Re-verification 2026-02-05 (PROMPT_build execute one spec): all AC re-verified (deps, interop.ts helpers, entity ids with interopAddress, drag withInteropAddress/getIntentDragPayload, interop.spec + drag.spec); test:unit 41 Deno + 101 Vitest passed. Re-verification 2026-02-05 (PROMPT_build one spec): re-verified 054; all AC confirmed; test:unit 41 Deno + 101 Vitest passed. Re-verification 2026-02-05 (PROMPT_build execute one spec): all 11 AC re-verified (deps, interop.ts, entity ids, drag payloads, interop.spec + drag.spec); test:unit 41 Deno + 101 Vitest passed.

## Output when complete

`DONE`
