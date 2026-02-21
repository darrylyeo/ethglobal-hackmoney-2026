# Spec 095: Boolean prop naming conventions (Svelte)

Standardise naming of boolean props on Svelte components so intent is clear and
passthrough to native/bits-ui attributes is preserved.

## Scope

- All Svelte components that declare boolean props via `$props()`.
- Applies to component **prop names** (public API), not local state or snippet
  parameters.

## Rules

### 1. Adjective booleans: `is[Adjective]`

For props that describe a **state or quality** (adjective or participle), use
the `is` prefix with the adjective in PascalCase.

- Examples: `isLinked`, `isVertical`, `isDraggable`, `isCompact`, `isOpen`,
  `isLoading`, `isInteractive`, `isInvalid`, `isFull`, `isExecuting`, `isVisible`.
- Do **not** rename props that are **verb + adjective** (e.g. `showAvatar`,
  `setActive`); keep those as-is.

### 2. Noun / feature booleans: `has` or `with`, not `is`

When the boolean refers to the **presence of a thing** (noun) or a **mode**
rather than a pure adjective, avoid `is[Noun]`. Prefer:

- **`has[Noun]`** when the prop means “has this thing” (e.g. `hasAnchorTitle`).
- **`with[Noun]`** when the prop means “with this feature/mode” (e.g.
  `withMultiline`, `withSlider`, `withAutofocus`).
- If the prop already uses a standard preposition (e.g. `withSlider`), keep it;
  do not turn it into `isWithSlider`.

### 3. Passthrough standard HTML / bits-ui attributes: keep names unchanged

Boolean props that are **passed through** to native elements or bits-ui
components must keep the **standard attribute name** so they can be spread or
passed directly.

- **`disabled`** — do not rename to `isDisabled` when the value is forwarded to
  `<input>`, `<button>`, `Select.Root`, `Button.Root`, etc.
- **`autofocus`** — keep as `autofocus` when it drives focus behaviour or
  native `autofocus`.
- **`multiple`** — keep as `multiple` when it corresponds to select/input
  multiple mode or type.

Same applies to other standard or bits-ui boolean attributes (e.g. `readOnly`,
`required`) if used as passthrough.

### 4. Default / initial state

- For “default open/visible” style props, `defaultIsOpen` / `defaultIsVisible`
  are acceptable (adjective applies to the default).
- Type/data shape properties (e.g. on `NavigationItem`) follow the same rules:
  e.g. `defaultIsOpen`, `hasAnchorTitle`.

## Summary table

| Kind                         | Example prop  | Name pattern / example   |
|-----------------------------|---------------|---------------------------|
| Adjective / state           | linked, open  | `isLinked`, `isOpen`     |
| Verb + adjective            | showAvatar    | keep as-is               |
| Noun / “has X”              | anchor title  | `hasAnchorTitle`         |
| Noun / “with X” (mode)      | slider, multiline | `withSlider`, `withMultiline` |
| Passthrough HTML/bits-ui    | disabled, autofocus, multiple | `disabled`, `autofocus`, `multiple` |

## Acceptance criteria

- [x] All Svelte components with boolean props follow the rules above (audited; adjective props normalized: FarcasterCast `compact`→`isCompact`, PaginationPlaceholder/FarcasterUserLinkList loading state→`isLoading`).
- [x] No boolean prop is named `is[Noun]` where the suffix is a noun; use
  `has` or `with` (or keep passthrough name) instead. Existing `is*` props in codebase are adjective/state (isOpen, isCompact, isLinked, etc.).
- [x] Props that are passed through to native or bits-ui elements use the
  standard attribute name (`disabled`, `autofocus`, `multiple`, `loading` for img, etc.).
- [x] No `[verb][Adjective]`-style props (e.g. `showAvatar`) are renamed.

## Status

Complete. Applied naming rules to components with adjective/state booleans; passthrough and verb+adjective props left unchanged. TransferDialog bug fixed (`open`→`isOpen` in handler).
