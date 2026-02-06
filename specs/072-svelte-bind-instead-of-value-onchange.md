# Spec 072: Svelte — Prefer bind over value + onThingChange

Use two-way binding (`bind:thing` or `bind:thing={getter, setter}`) instead of
passing a value prop plus an `onThingChange` callback for the same logical
state.

## Scope

- **Components:** Any Svelte component that exposes a piece of state to parents
  (e.g. `value`, `open`, `checked`, `selection`, `status`, `settings`,
  `preview`).
- **Native elements:** `<input>`, `<select>`, and other elements that support
  `bind:value` (or `bind:checked`, etc.) including Svelte 5 function binding.
- **Libraries:** When wrapping bits-ui or other libraries that support bindable
  props, use their bind API instead of `value` + `onValueChange` (or
  equivalent).

## Non-goals

- Do not replace **one-way event callbacks** (e.g. `onSubmit`, `onDismiss`,
  `onNodeEnter`, `onExecutionSuccess`) with bindings; those are events, not
  shared state.
- Do not replace **callback-only APIs** where the child passes data to the
  parent once (e.g. `onExecute={(fn) => { executeFunction = fn }}`); there is
  no “value” to bind.
- Do not change **internal** wiring (e.g. a component’s own `onValueChange`
  handler that syncs a sub-component to its `$bindable()` prop); the public
  API is what we normalize.

## Rules

### 1. Component API: expose bindable props

For state that is both readable and writable by the parent:

- Prefer a **single bindable prop** (e.g. `value = $bindable(...)`) and
  document that parents should use `bind:value` or `bind:value={getter, setter}`.
- Do **not** add a parallel `onValueChange` (or `onThingChange`) callback;
  binding is the canonical way to observe and update the value.

### 2. Parent usage: bind instead of value + onChange

When the child supports binding:

- Use **direct bind** when the parent owns a variable:
  - `bind:value={myValue}`
  - `bind:open={isOpen}`
- Use **function binding** when the value is derived or stored elsewhere (e.g.
  in a collection or a larger state object):
  - `bind:value={() => tree.name ?? '', updateTreeName}`
  - `bind:value={() => settings.amount, (v) => updateParams({ ...settings, amount: v })}`
  - `bind:checked={() => item.checked, (c) => item.onCheckedChange?.(c)}`
  (e.g. when forwarding to a library that still expects a callback in its item
  config).

### 3. Native elements (Svelte 5)

- Use **function binding** for inputs whose “source of truth” is not a simple
  variable (e.g. derived from props or a store/collection):
  - `bind:value={() => displayValue, setter}`
- This applies to `<input>`, `<select>`, and other bindable elements that
  support Svelte 5’s getter/setter binding.

### 4. Third-party components (e.g. bits-ui)

- Prefer the library’s **bind** API when available (e.g. `bind:value`,
  `bind:checked`).
- Use **function binding** when the bound value is derived or wrapped:
  - `bind:value={() => (Array.isArray(value) ? value : []), (v) => (value = v)}`

## Exceptions

- **`bind:group` (radio/checkbox groups):** Svelte only allows `bind:group` to an
  identifier or member expression, not a getter/setter. Keep `checked={...}` +
  `onchange` (or equivalent) when the selected value is derived (e.g. from
  session params).
- **Item/entry config objects:** When rendering a list of items (e.g. dropdown
  menu entries) and each item carries its own `value` and `onValueChange` from
  the config, we may still pass `bind:value={() => item.value, item.onValueChange}`
  into the library; the “API” we’re normalizing is our template, not the
  external item shape.
- **Commit-on-blur / parse-on-change:** Inputs that are bound to local state and
  also trigger a separate “commit” or “parse” action (e.g. `bind:value={hashInput}`
  plus `onchange={commitHash}`) are fine; the callback is not the setter for
  the bound value.

## Acceptance criteria

- [x] Components that previously had `thing` + `onThingChange` expose a bindable
  prop and no longer document or accept `onThingChange` for that state (see
  ModelInput, Combobox, Select, G6GraphView, UnifiedProtocolRouter, BridgeFlow,
  BridgeExecution, etc.).
- [x] Parents use `bind:thing` or `bind:thing={getter, setter}` instead of
  `thing={...}` + `onThingChange={...}` where the child supports it.
- [x] Native inputs that had `value={...}` + `oninput`/`onchange` use
  `bind:value` (direct or function binding) where the setter is the only
  side-effect (no separate commit/parse callback required in the binding).
- [x] bits-ui usage (Select.Root, Combobox.Root, DropdownMenu.CheckboxItem,
  DropdownMenu.RadioGroup) uses `bind:value` / `bind:checked` (with function
  binding when the value is derived) instead of `value` + `onValueChange` (or
  `checked` + `onCheckedChange`).
- [x] Exceptions (e.g. `bind:group`, commit-on-blur, one-way events) are
  documented and left as value + handler where binding is not supported or
  not appropriate.

## Status

Complete. Applied across Svelte files in 2026-02; remaining value/onChange
usages are either exceptions above or internal wiring.

## Output when complete

`DONE`
