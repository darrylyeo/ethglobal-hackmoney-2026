# Spec 045: Schema + constants preferences

Document repository preferences for defining schema types and constants:
minimal types, one array per type, explicit separation of paired concepts,
reuse of existing domain types, and single-purpose derived indices.

## Scope

- Define the minimal set of schema types needed for constants.
- Keep types and constants in `src/constants/` (one place; no separate schema
  layer for constants).
- One array of objects per schema type; no mixed or redundant arrays.
- Where data has a natural pair (e.g. base/quote, source/target), model both
  sides explicitly.
- Reuse existing domain types (e.g. `Coin`, `Erc20Token`, `ChainId`) instead of
  redefining equivalent concepts.
- When an entity is read from a different context than its primary one (e.g.
  oracle on another chain), capture that context when it differs.
- One derived index object per distinct lookup; no combined or overloaded
  indices.
- Keep constant values aligned with current upstream documentation.
- Prefer discrete TypeScript enums over string unions for fixed sets of
  values; enums may be used as discriminants in `src/constants` object
  arrays.

## Enum preference

Enums: always TitleCase; same key as value (member name equals string value).
In spec doc code blocks use `typescript` and tab indentation.

```typescript
enum EnumName {
	EnumValue1 = 'EnumValue1',
	EnumValue2 = 'EnumValue2',
}
```

Prefer this over TypeScript string unions (e.g. `'a' | 'b'`). These enums
may be used as discriminant fields in `src/constants` object arrays (e.g.
`subject: AssetSubject.Network`, `source: DataSource.LiFi`).

## Constants file pattern

Every constants module that exposes lookups MUST follow this structure only:

1. **Enum(s)** — fixed sets as string enums (discriminant domain).
2. **Single canonical array** — `readonly` array of objects; each object has one enum field as the discriminant (e.g. `id`, `type`, `serialization`).
3. **Derived mapping(s)** — all lookups are derived from that array via `Object.fromEntries(...)`:
   - One primary map: discriminant field → full object (e.g. `byId = Object.fromEntries(arr.map(e => [e.id, e]))`).
   - Optionally other maps from the same array for other fields (e.g. `labelById = Object.fromEntries(arr.map(e => [e.id, e.label]))`).

**Forbidden in `src/constants/`:**

- Helper functions (move to `src/lib/` or domain modules).
- Manually written dictionary/record literals used as lookups (derive from the canonical array instead).

## Non-goals

- Changing runtime behavior beyond structure and data alignment.
- Adding new features or data sources as part of this spec.

## Acceptance criteria

### Schema types

- [x] Constants modules depend only on the minimal schema types required for
  their data.
- [x] Types live alongside constants in `src/constants/` (no duplicated type
  definitions).
- [x] Paired concepts (e.g. base/quote) are separate fields or types, not
  encoded in a single string or overloaded field.
- [x] Domain concepts (symbols, chain ids, tokens, etc.) use existing shared
  types where they exist.

### Constants structure

- [x] Each schema type has a single canonical array of objects in
  `src/constants/`.
- [x] Each derived lookup is one index object (e.g. `byId`, `bySymbol`);
  indices are not merged or overloaded.
- [x] When an entity’s “read context” (e.g. chain, endpoint) can differ from its
  primary context, that is represented explicitly (e.g. optional
  `oracleChainId`).
- [x] Data values are consistent with current upstream docs.

### Enum usage

- [x] Fixed sets of string values are expressed as string enums (member
  `= 'MemberName'`) in `src/constants/`, not as string unions.
- [x] Discriminant fields in `src/constants` object arrays use enum values
  (e.g. `subject: AssetSubject.Network`) where an enum exists for that domain.

### Constants file pattern

- [x] Lookups in constants modules are derived only via `Object.fromEntries(...)` from the canonical array (discriminant or other field as key).
- [x] No helper functions in `src/constants/`; no manually defined dictionary literals for lookups.

## Status

Complete. 2026-02-05 (PROMPT_build execute one spec): Enum usage AC implemented. stork.ts: StorkApiRegion (Jp, Dev), StorkApiTransport (Rest, Websocket) as string enums; storkApiEndpoints and storkDefaultRegion use enum values. assets.ts: AssetSubject (Network, Coin, Brand), FetchTypeKind (Zip, Png, Url); AssetSource uses subject. Script _sync-assets.ts uses FetchTypeKind and AssetSubject (see spec 052). test:unit 41 Deno + 101 Vitest passed.

## Output when complete

`DONE`
