# Spec 098: TreeNode component

Add a reusable generic tree component `TreeNode.svelte` that renders expandable/collapsible nodes with custom content. Structure is adapted from `NavigationItem.svelte`: recursive tree, `details`/`summary` for expandable nodes, content via snippet.

## Scope

- **Component:** `src/components/TreeNode.svelte`
- **Generic:** `_Node` (node type), `_Key` (key type for list keying, default `string | number`).
- **Props:**
  - `nodes: _Node[]` — root or child nodes to render.
  - `getKey: (node: _Node) => _Key` — stable key for each node.
  - `getChildren: (node: _Node) => _Node[] | undefined` — children for expandable nodes; leaf when undefined or empty.
  - `isOpen: (node: _Node) => boolean` — whether the node’s details are open.
  - `onOpenChange?: (node: _Node, open: boolean) => void` — called when user toggles open state; when provided, parent controls open state.
  - `Content: Snippet<[{ node: _Node }]>` — renders the label/row for each node (inside summary for expandable, or standalone for leaf).
  - `listTag?: 'ul' | 'menu'` — tag for the list wrapper (default `'ul'`).
  - `listAttrs?: Record<string, string>` — attributes applied to the list element (e.g. `{ 'data-column': 'gap-0' }`).
  - `detailsAttrs?: Record<string, string>` — attributes on each `<details>` (e.g. `data-sticky-container`).
  - `summaryAttrs?: Record<string, string>` — attributes on each `<summary>`.
- **Behavior:**
  - For each node, if `getChildren(node)` is non-empty: render `<details open={isOpen(node)}>`, `<summary>`, then `Content`, then recurse with `TreeNode` and `nodes={getChildren(node)}`. On toggle, call `onOpenChange(node, !isOpen(node))`.
  - If no children (undefined or empty): render only `Content` (no details/summary).
  - List wrapper uses `listTag` and `listAttrs`; each node is wrapped in `<li>`.

## Non-goals

- Search/filter, keyboard nav, or accessibility beyond basic structure (can be added later).
- Virtualization or lazy loading of children.

## Dependencies

- None. NavigationItem will be refactored to use TreeNode (spec 091 unchanged; data still from `useNavigationItems`).

## Acceptance criteria

- [x] `TreeNode.svelte` exists in `src/components/` with generic `_Node` and optional `_Key`.
- [x] Props `nodes`, `getKey`, `getChildren`, `isOpen`, `onOpenChange`, `Content`, `listTag`, `listAttrs`, `detailsAttrs`, `summaryAttrs` implemented as described.
- [x] Expandable nodes render as `<details>`/`<summary>` with recursive `TreeNode` for children; leaf nodes render only `Content`.
- [x] Open state is driven by `isOpen(node)`; toggling calls `onOpenChange(node, open)` when provided.
- [x] `NavigationItem.svelte` is refactored to use `TreeNode`: tree structure delegated to TreeNode; nav-specific logic (search, linkable content, styles) remain in NavigationItem; no change to `NavigationItem` type or `getNavigationItems`/`useNavigationItems` API.

## Status

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 098 again): All 5 AC confirmed—TreeNode.svelte in src/components/ with generics _Node, _Key; props nodes, getKey, getChildren, isOpen, onOpenChange, Content, listTag, listAttrs, detailsAttrs, summaryAttrs; expandable nodes <details>/<summary> + recursive TreeNode, leaf nodes Content only; isOpen(node) and onOpenChange(node, open) on toggle; NavigationItem.svelte uses TreeNode with treeGetChildren, treeIsOpen, treeOnOpenChange, NavContent; nav-specific search, Linkable, styles unchanged. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Re-verification 2026-02-21 (PROMPT_build execute one spec, re-verify 098): All 5 AC confirmed—TreeNode.svelte in src/components/ with generics _Node, _Key; props nodes, getKey, getChildren, isOpen, onOpenChange, Content, listTag, listAttrs, detailsAttrs, summaryAttrs; expandable nodes use <details>/<summary> and recursive TreeNode, leaf nodes Content only; open state via isOpen(node), ontoggle calls onOpenChange(node, open); NavigationItem.svelte uses TreeNode with treeGetChildren, treeIsOpen, treeOnOpenChange, NavContent snippet; nav-specific logic (search, Linkable, styles) in NavigationItem. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db).
