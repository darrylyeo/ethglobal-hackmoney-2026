# Spec 071: RichTextarea and RichTextareaReference

Contenteditable that interpolates reference slots between text segments. Each slot renders as **RichTextareaReference**: trigger character (e.g. `@`) plus either an inline **Combobox** (when that slot is editable and focused) or a chip. Trigger characters are generic; a **trigger config** maps each character to suggestions and (for parsing) pattern matches. No single combobox for the whole field—each reference has its own.

## Scope

- **RichTextarea.svelte** — contenteditable root, segments + refs bindings, trigger config, parse/serialize, key handling (trigger key, Arrow Left/Right at boundaries, Delete).
- **RichTextareaReference.svelte** — display by `isEditable && isFocused`: combobox (with `bind:inputValue`), trigger-only span, or chip; keydown (Left/Right/Delete/Backspace) and focusout (onBlur).
- **Data model**: `segments: string[]`, `refs: Ref[]` with `Ref` extending `{ displayLabel: string, trigger?: string }`; placeholder ref for the "empty" slot; trigger config per character.
- **Agent chat / EntityRefInput**: uses RichTextarea with entity trigger config and value/entityRefs sync.

## Non-goals

- No rich formatting (bold, links, etc.); plaintext-only.
- No virtualization or multi-line measurement beyond native contenteditable.

## Data model

- **segments**: `string[]` — text before ref₀, between ref₀ and ref₁, …, after last ref. Length = `refs.length + 1`.
- **refs**: `Ref[]` — one ref between each adjacent segment. `Ref` extends `{ displayLabel: string, trigger?: string }`. `trigger` selects which trigger config entry to use and which character to show/append.
- **Placeholder ref**: one ref may be a "placeholder" (e.g. `entityId === '__placeholder__'`). That slot is **editable**; it shows the combobox only when **focused** (`isEditable && isFocused`).
- **Trigger config**: `Record<string, { getSuggestions(query): Item[], pattern?: RegExp }>`. Keys are trigger characters. `pattern` is used when parsing pasted text (value part after the trigger).

## RichTextarea

- **Props**: `segments` (bindable), `refs` (bindable), `isPlaceholder(ref)`, `getPlaceholderRef(trigger)`, `triggerConfig`, `getItemId`, `getItemLabel`, `serializeRef`, `parseRef`, `placeholder`, `disabled`, `autofocus`.
- **Renders**: contenteditable root; for each index `i`: segment text node, then (if `i < refs.length`) `<RichTextareaReference ref={refs[i]} triggerCharacter={…} isEditable={…} isFocused={…} getSuggestions={…} … />`. `isFocused` is derived from `isPlaceholder(ref) && placeholderFocused`; parent tracks `placeholderFocused` and clears it on blur/close/select.
- **Input**: parse DOM to segments/refs (text nodes and elements with `data-placeholder` or chip `parseRef`); restore caret after tick.
- **Keydown**:
  - **Trigger key** (key in `triggerConfig`): insert placeholder at caret via `getPlaceholderRef(e.key)`, then `focusPlaceholderInput('start')` (sets `placeholderFocused = true`, focuses `[data-placeholder] input`, cursor at 0).
  - **ArrowRight** at end of segment before placeholder (caret to the left of ref): focus that ref's combobox with cursor at **start** (`focusPlaceholderInput('start')`).
  - **ArrowLeft** at start of segment after placeholder (caret to the right of ref): focus that ref's combobox with cursor at **end** (`focusPlaceholderInput('end')`).
  - **Delete** when caret immediately left of placeholder: remove reference (merge segments), clear `placeholderFocused`, focus contenteditable at merge point.
- **Close/merge**: `closeComboboxAndFocusEditable` and `closeComboboxAndAppendAt` clear `placeholderFocused`, merge or append trigger char, then focus contenteditable. `onSelect` clears `placeholderFocused` and replaces placeholder ref with selected ref.

## RichTextareaReference

- **Props**: `ref`, `triggerCharacter`, `isEditable`, `isFocused`, `getSuggestions`, `getItemId`, `getItemLabel`, `onselect`, `serializeRef`, `onMoveCaret`, `onClose`, `onCloseEmpty`, `onBlur`.
- **Display**:
  - **isEditable && isFocused**: wrapper with `data-placeholder`, `data-trigger={triggerCharacter}`, `::before { content: attr(data-trigger) }`, and **Combobox** with `bind:inputValue={filterValue}`. Input uses `field-sizing: content`; all relevant nodes `display: inline`.
  - **isEditable && !isFocused**: span with `data-placeholder`, `data-trigger`, showing only the trigger character (for parsing and display when not focused).
  - **!isEditable**: chip span with `data-ref-chip` and `serializeRef` data attributes, `contenteditable="false"`, `displayLabel`.
- **Keydown** (capture on placeholder wrapper): ArrowLeft/Right → `onMoveCaret('left'|'right')`; Delete/Backspace when `filterValue === ''` → `onCloseEmpty()`, else do not prevent default (native delete in input).
- **Focusout**: when focus leaves the placeholder wrapper, call `onBlur()` so parent sets `placeholderFocused = false`.

## Key behaviors (non-disruptive)

- **Trigger key**: Insert placeholder at selection; focus its combobox input with cursor at start.
- **Arrow Right** (caret at end of segment before a ref): move focus into that ref's combobox, cursor at **leftmost** (start).
- **Arrow Left** (caret at start of segment after a ref): move focus into that ref's combobox, cursor at **rightmost** (end).
- **Delete** (caret in contenteditable immediately left of ref): remove ref, merge segments.
- **Delete/Backspace** (focus in ref's combobox): if input empty → remove ref, append trigger char to previous segment, focus contenteditable after it; else → native delete in input (no close).

## Agent chat / EntityRefInput

- Uses **RichTextarea** with `Ref = EntityRef`, `triggerConfig` (e.g. `'@'` → `getEntitySuggestionsFromCache`), `getPlaceholderRef(trigger)`, and value/entityRefs derived from segments/refs via `getValueFromSegmentsAndRefs` and `parseValueToSegmentsAndRefs(value, entityTriggerParseConfig)`.
- Form submit and bindings unchanged; only the inner implementation is RichTextarea + RichTextareaReference.

## Acceptance criteria

- [x] RichTextarea accepts `segments`, `refs` (bindable), `isPlaceholder`, `getPlaceholderRef`, `triggerConfig`, `getItemId`, `getItemLabel`, `serializeRef`, `parseRef`, and renders contenteditable with one RichTextareaReference per ref.
- [x] Reference display is driven by `isEditable && isFocused`: combobox when both, trigger-only when editable and not focused, chip when not editable.
- [x] Trigger key inserts placeholder and focuses its input (cursor at start); ArrowRight at boundary before ref focuses that ref's input (cursor at start); ArrowLeft at boundary after ref focuses that ref's input (cursor at end).
- [x] Delete when caret left of ref removes ref and merges segments; Delete/Backspace in combobox when input empty removes ref and appends trigger char; when input non-empty, native behavior (no close).
- [x] Combobox input value is bound (`bind:inputValue`) to reference filter state; placeholder wrapper reports blur via `onBlur`.
- [x] Parse contenteditable DOM (text nodes, `data-placeholder`, chip `parseRef`) to segments/refs; serializeRef/parseRef include `trigger` for chips; trigger-only and placeholder wrapper both use `data-placeholder` + `data-trigger` for parsing.
- [x] EntityRefInput (or agent chat) uses RichTextarea with entity trigger config and value/entityRefs sync; e2e prompt-input tests pass.

## Status

Complete. 2026-02-06 (PROMPT_build execute one spec): All 7 AC verified. RichTextarea.svelte and RichTextareaReference.svelte implement segments/refs, trigger config, display modes (combobox/trigger-only/chip), key handling (trigger, Arrow Left/Right, Delete, close/merge), parseContent from DOM, bind:inputValue and onBlur. EntityRefInput uses RichTextarea with entity trigger config and value/entityRefs sync. e2e/prompt-input.test.ts covers focus, @ placeholder, arrow keys, selection, Send disabled when placeholder open. test:unit 44 Deno + 101 Vitest passed.
