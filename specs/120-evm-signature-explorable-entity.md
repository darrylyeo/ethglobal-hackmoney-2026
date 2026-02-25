# Spec 120: Evm selector and Evm topic as explorable entities under Tools

Add **EvmSelector** and **EvmTopic** as explorable entities: separate list and detail pages under **Tools**, backed by **EvmSelectors** and **EvmTopics** TanStack DB collections. Model after Explore pages (e.g. Proposals per Spec 112): list page with live query + Sorts, detail page with EntityView, watched-entity nav children.

## References

- Spec 002 (TanStack DB collections), Spec 065 (external API cache and live-query-only reads), Spec 088 (EntityView), Spec 091 (navigation items), Spec 093 (watched entities, typed entity id), Spec 094 (id serializations), Spec 105 (Sorts), Spec 110 (External ABI and signature lookup APIs; EvmSelectors/EvmTopics collections; 4byte.sourcify.dev replaces openchain.xyz, 4byte.directory)
- [4byte.sourcify.dev](https://4byte.sourcify.dev/) — Evm selector / Evm topic → Evm signatures (replaces openchain.xyz); API: `GET https://api.4byte.sourcify.dev/signature-database/v1/lookup?function={hex4}&event={hex32}`
- [4byte.directory API](https://www.4byte.directory/docs/) — Function/event signatures; `GET .../signatures/?hex_signature={hex4}` and `.../event-signatures/?hex_signature={hex32}`

## Relevant entities (Evm-prefixed)

- **Evm selector**: 4-byte function selector (hex); identifies a function. One explorable row per selector.
- **Evm topic**: 32-byte event topic hash (hex); identifies an event. One explorable row per topic.
- **Evm signature** (text): Human-readable signature string (e.g. `transfer(address,uint256)`). An Evm selector or Evm topic row has a list of **Evm function signatures** or **Evm event signatures** from 4byte.sourcify.dev / 4byte.directory.

## Definitions

- **EvmSelector** (entity type): Cache entry for one **Evm selector** (4-byte hex) with one or more **Evm function signatures** (text). Backing data: `EvmSelector` in `src/data/EvmSelector.ts`; collection: `evmSelectorsCollection` in `src/collections/EvmSelectors.ts`. Entity id: `EvmSelector$Id` (`{ hex: \`0x${string}\` }`).
- **EvmTopic** (entity type): Cache entry for one **Evm topic** (32-byte hex) with one or more **Evm event signatures** (text). Backing data: `EvmTopic` in `src/data/EvmTopic.ts`; collection: `evmTopicsCollection` in `src/collections/EvmTopics.ts`. Entity id: `EvmTopic$Id` (`{ hex: \`0x${string}\` }`).

## Relationship and representation

- **Evm selector** and **Evm topic** are two distinct EVM identities: selector = 4-byte function hash (calldata); topic = 32-byte event hash (logs). Both are lookup keys: we send hex to 4byte.sourcify.dev / 4byte.directory and get back **text signatures**. One key can have multiple text signatures.
- **Evm signature (text)** is the value returned for a given selector or topic; the explorable thing is the lookup result (selector/topic + resolved signatures).
- Implementation uses **two entity types** and **two collections** (EvmSelectors, EvmTopics) so routes, nav, and watched entities are separate per kind; no `kind` discriminator in URLs or collection keys.

## APIs / services / sources

Evm selector and Evm topic lookups are served by 4byte.sourcify.dev and 4byte.directory. The collection layer calls both, merges and dedupes, and upserts into `evmSelectorsCollection` or `evmTopicsCollection` (Spec 110). UI and explorer read only from the collections (Spec 065).

| Source | Role | API / module |
|--------|------|--------------|
| **4byte.sourcify.dev** | Evm selector / Evm topic → Evm signatures (replaces openchain.xyz) | `src/api/openchain.ts` — `fetchFunctionSignatures(selector)`, `fetchEventSignatures(topicHash)` |
| **4byte.directory** | Evm function/event signatures | `src/api/fourbyte.ts` — `fetchFunctionSignatures(selector)`, `fetchEventSignatures(topicHash)` |

- **Fetch flow**: `ensureEvmFunctionSignatures(selector)` in `src/collections/EvmSelectors.ts` and `ensureEvmEventSignatures(topicHash)` in `src/collections/EvmTopics.ts` call both APIs when a row is missing, merge and dedupe the text arrays, then insert. Hex normalized via `normalizeEvmSelector4` / `normalizeEvmTopic32`.
- **Explorer UI**: List and detail pages use live queries on `evmSelectorsCollection` / `evmTopicsCollection`; they do not call the APIs directly.

## Implementation (current)

### Entity types and data

- **`src/data/$EntityType.ts`**: `EvmSelector = 'EvmSelector'` and `EvmTopic = 'EvmTopic'` in `EntityType`; `EntityByType` maps to `EvmSelector` and `EvmTopic`; `EntityIdByType` maps to `EvmSelector$Id` and `EvmTopic$Id`. Labels (displayed to user): "EVM selector(s)", "EVM topic(s)" (entityTypes in $EntityType).
- **Data**: `src/data/EvmSelector.ts` (`EvmSelector$Id`, `EvmSelector`); `src/data/EvmTopic.ts` (`EvmTopic$Id`, `EvmTopic`). Each has `$id: { hex }` and `signatures: string[]`.

### Collections

- **`src/collections/EvmSelectors.ts`**: `evmSelectorsCollection` (id: `CollectionId.EvmSelectors`), `normalizeEvmSelector4(hex)`, `ensureEvmFunctionSignatures(selector)`.
- **`src/collections/EvmTopics.ts`**: `evmTopicsCollection` (id: `CollectionId.EvmTopics`), `normalizeEvmTopic32(hex)`, `ensureEvmEventSignatures(topicHash)`.
- **`src/constants/collections.ts`**: `EvmSelectors`, `EvmTopics` in `CollectionId`.

### Path helpers

- **`src/lib/signature-paths.ts`**: `getEvmSelectorPath(hex)`, `getEvmTopicPath(hex)`, `getEvmErrorPath(hex)`, `parseEvmSelectorHex(hexParam)`, `parseEvmTopicHex(hexParam)`, `parseEvmErrorHex(hexParam)`. URLs: `/evm/selector/{hex}`, `/evm/topic/{hex}`, `/evm/error/{hex}` (hex encoded; singular segment for entity detail).

### Routes

- **Landing**: `src/routes/evm/+page.svelte` — links to Evm selectors, Evm topics, Evm errors, Calldata decoder.
- **Evm selectors list**: `src/routes/evm/selectors/+page.svelte` — live query on `evmSelectorsCollection`, Sorts (hex, first signature), links to detail.
- **Evm selector detail**: `src/routes/evm/selector/[hex]/+page.svelte` — parse hex with `parseEvmSelectorHex`, ensure via `ensureEvmFunctionSignatures`, render `<EntityView entityType={EntityType.EvmSelector}>` with `EvmSelector` view.
- **Evm topics list**: `src/routes/evm/topics/+page.svelte` — live query on `evmTopicsCollection`, Sorts, links to detail.
- **Evm topic detail**: `src/routes/evm/topic/[hex]/+page.svelte` — parse hex with `parseEvmTopicHex`, ensure via `ensureEvmEventSignatures`, render `<EntityView entityType={EntityType.EvmTopic}>` with `EvmTopic` view.
- **Evm errors list**: `src/routes/evm/errors/+page.svelte`; **Evm error detail**: `src/routes/evm/error/[hex]/+page.svelte`.

### Views

- **`src/views/EvmSelector.svelte`**: Props `entry: EvmSelector`; shows hex (4-byte) and list of Evm function signatures.
- **`src/views/EvmTopic.svelte`**: Props `entry: EvmTopic`; shows hex (32-byte) and list of Evm event signatures.

### Navigation (Tools)

- **`src/routes/navigationItems.svelte.ts`**: **Tools** section has:
  - **EVM Signatures** (href `/evm`, defaultIsOpen) with children:
    - **Evm selectors** (href `/evm/selectors`, tag = count when any watched) — `children` / `allChildren` = watched Evm selector nav items.
    - **Evm topics** (href `/evm/topics`, tag = count when any watched) — `children` / `allChildren` = watched Evm topic nav items.
    - **Evm errors** (href `/evm/errors`, tag = count when any watched).
  - **Calldata decoder** (href `/calldata-decoder`).

### Watched-entity derivation

- **`deriveWatchedEntity`**: Cases `EntityType.EvmSelector` and `EntityType.EvmTopic`. Label = `entityId.hex`; href = `getEvmSelectorPath(hex)` / `getEvmTopicPath(hex)`.
- **Watched nav items**: `watchedEvmSelectors` and `watchedEvmTopics` from `watchedByType`; mapped to nav items with `id`, `title` (label), `href`, `icon`, `manualWatch: true`; set as children of Evm selectors / Evm topics in Tools (spec 127).
- **Layout**: When `watchedTypes.has(EntityType.EvmSelector)` or `has(EntityType.EvmTopic)`, register `evmSelectorsQuery` / `evmTopicsQuery` in the global live-query stack so those collections are subscribed.

### Callers (no backcompat barrel)

- Calldata decoder, session Calldata, network Transaction, Trace, Event import from `EvmSelectors.ts` or `EvmTopics.ts` directly (normalize hex, query collection, ensure when needed).

## Acceptance criteria

- [x] `EntityType.EvmSelector` and `EntityType.EvmTopic`; entity types map to `EvmSelector` / `EvmTopic` and corresponding `$Id` types.
- [x] Landing at `/evm`; list routes at `/evm/selectors`, `/evm/topics`, `/evm/errors` with live query and Sorts; detail routes at `/evm/selector/[hex]`, `/evm/topic/[hex]`, `/evm/error/[hex]` (singular segment).
- [x] Detail pages ensure row via collection API and render EntityView with EvmSelector / EvmTopic view component.
- [x] Tools nav: EVM Signatures parent with Evm selectors and Evm topics (with watched children); Calldata decoder sibling.
- [x] `deriveWatchedEntity` handles EvmSelector and EvmTopic; watched entities appear as children under Evm selectors / Evm topics in nav.
- [x] Path helpers and collection/ensure functions use evm-prefixed names; no SelectorSignatures barrel.

## Status

Implemented.
