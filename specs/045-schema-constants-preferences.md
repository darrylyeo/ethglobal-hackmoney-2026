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

## Status

Complete.

## Output when complete

`DONE`
