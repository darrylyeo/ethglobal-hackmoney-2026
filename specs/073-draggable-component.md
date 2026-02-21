# Spec 073: Draggable component

Encapsulate HTML5 drag behavior and intent-drag integration in a **Svelte attachment** (element-level lifecycle, no wrapper DOM), replacing duplicated logic in `EntityId.svelte` and `CoinAmount.svelte`. See [Svelte docs: {@attach}](https://svelte.dev/docs/svelte/%40attach) and attachment factories.

## Scope

- One reusable **attachment factory** `draggable(options)` that callers apply with `{@attach draggable({ ... })}` on any element (span, a, div).
- Support plain-text and optional URI drag data; optional `IntentDragPayload` with preview and drag-over target updates.
- Opt-out via an `enabled` option so callers can disable without changing structure.
- Preserve existing behavior: same MIME types, same intent preview/drop behavior per spec 047.
- Reactive: when options (text, href, intent, enabled) change, the attachment re-runs per Svelte’s attachment semantics.

## Non-goals

- No new intent kinds or drag MIME types.
- No change to drop-target handling outside the attachment (consumers still use `getIntentDragPayload` where needed).

## Why attachment over wrapper component

- **No extra DOM**: Behavior is attached to the element the caller already has; no `<Draggable>` wrapper.
- **Element type stays with caller**: EntityId keeps `<a>` or `<span>`, CoinAmount keeps `<div>`.
- **Reactivity**: Attachment runs in an effect; changing `text`/`intent`/`enabled` re-runs the attachment (Svelte 5.29+).
- **Composable**: Same element can have multiple attachments.
- **Aligns with Svelte**: Element-level behavior via `{@attach}` (replacement for actions).

## Current usage to encapsulate

- **EntityId**: `<a>` or `<span>`, always draggable; `draggableText`, optional `link` (text/uri-list), optional `intent`; ondragstart sets data + `setIntentDragData` + `startIntentDragPreview`; ondragover/ondrop call `updateIntentDragTarget`.
- **CoinAmount**: `<div>` with `draggable` prop; ondragstart sets `text/plain` via `stringify(coin)`; no intent.
- Call sites pass `draggable={false}` to disable (e.g. in flows, balances list).

## API (proposed)

Export from `$lib/intents/drag` (or a dedicated `$lib/attachments/draggable`) an **attachment factory**:

```typescript
type DraggableOptions = {
  text: string
  href?: string
  intent?: IntentDragPayload
  enabled?: boolean  // default true
}

function draggable(options: DraggableOptions): Attachment
```

- **Usage**: `<span {@attach draggable({ text: address, intent })}>...</span>`, `<a href={link} {@attach draggable({ text, href: link, intent })}>...</a>`, `<div {@attach draggable({ text: stringify(coin), enabled: draggable })}>...</div>`.
- **Behavior**: When `enabled` is true, set `element.draggable = true`, add ondragstart (setData text/plain, optional text/uri-list, optional setIntentDragData + startIntentDragPreview), and if `intent` present add ondragover/ondrop calling updateIntentDragTarget. Return cleanup that removes listeners and resets draggable.
- **Reactivity**: Reading `options.text`, `options.href`, `options.intent`, `options.enabled` inside the returned attachment ensures it re-runs when those values change.

## Acceptance criteria

- [x] A `draggable(options)` attachment factory exists; it returns an attachment that runs on mount and when options (or state read inside it) change, and returns a cleanup function.
- [x] When `enabled` is true, the element has `draggable={true}` and ondragstart sets `text/plain` from `text`; if `href`, also sets `text/uri-list`.
- [x] When `intent` is provided and enabled, ondragstart calls `setIntentDragData` and `startIntentDragPreview`; ondragover and ondrop call `updateIntentDragTarget` with the element.
- [x] When `enabled` is false, the element is not draggable and no drag handlers are attached.
- [x] EntityId is refactored to use `{@attach draggable({ text: draggableText, href: link, intent })}` on its root `<a>`/`<span>` without changing public EntityId props or behavior.
- [x] CoinAmount is refactored to use `{@attach draggable({ text: stringify(coin), enabled: draggable })}` on its root element; `draggable` and plain-text payload unchanged.
- [x] All existing call sites that pass `draggable={false}` or `draggableText`/intent continue to work (no regression in flows, CoinBalances, Address, test intents page).
- [x] Existing drag-related tests (e.g. intent drag spec) still pass.

## Status

Complete. 2026-02-06 (PROMPT_build execute one spec): Draggable.svelte.ts attachment factory with text/href/intent/enabled; enabled=false sets element.draggable=false and returns no-op cleanup. EntityId and CoinAmount already used {@attach draggable(...)}. Unit tests (drag.spec.ts, test:unit) pass. Build fix in src/api/yellow.ts (PendingEntry type) unblocked e2e config.

## Completion signal

**Output when complete:** `DONE`
