# Spec 102: Svelte snippet patterns

Standardize how Svelte snippets are passed to components: prefer inline syntax when possible, and define snippets before the component when they must be passed by reference.

## Scope

- When a snippet is a direct component prop: use the traditional inline syntax inside the component tags.
- When a snippet must be passed by reference (e.g. within an object or array prop): define the snippet before the component, manually type it, and wrap in a local scope (`<svelte:boundary>` or `{#if true}`) when no existing scope exists.

## Rationale

- **Inline syntax:** Params are automatically typed/inferred from the component's snippet prop type.
- **By-reference:** Required when the snippet lives in an object/array (e.g. `items: [{ label: 'X', Item: mySnippet }]`). Must be defined beforehand; manual typing ensures correctness. Local scope avoids leaking the snippet into outer scope.

## Rules

1. **Snippet names** — Prefer TitleCase for snippet names (e.g. `Item`, `Input`, `ItemRenderer`).
2. **Direct prop** — Use `{#snippet Name(args)}` inside the component. Prefer not to specify explicit types for the params; they are inferred from the component's snippet prop.
   ```svelte
   <Combobox {items}>
     {#snippet Item(item, selected)}
       <span>{item.label}</span>
     {/snippet}
   </Combobox>
   ```

3. **By reference** — Define before the component, type explicitly, scope locally:
   ```svelte
   {#if true}
     {#snippet ItemRenderer(item: MyItem, selected: boolean)}
       <span>{item.label}</span>
     {/snippet}
     <SomeComponent
       items={[
         { label: 'A', Item: ItemRenderer },
         { label: 'B', Item: ItemRenderer },
       ]}
     />
   {/if}
   ```

4. **Scope** — Use `<svelte:boundary>` or `{#if true}` only when there is no existing containing scope (e.g. loop, conditional, `{#each}` block).

## Acceptance criteria

- [x] Snippet prop names and default snippet names in our components use TitleCase where not constrained by a framework (e.g. Bits UI `child`/`children`, `svelte:boundary` slots).
- [x] When a snippet is a direct component prop, call sites use inline `{#snippet Name(args)}` inside the component tags.
- [x] When a snippet is passed by reference (in object/array), it is defined before the component with explicit param types and wrapped in `<svelte:boundary>` or `{#if true}` when no containing scope exists.
- [x] No snippet passed by reference is defined at module/top level without a wrapping scope.

## Status

Complete. 2026-02-21 (PROMPT_build execute one spec): Acceptance criteria added. Codebase audited: direct snippet props use inline syntax; by-reference usage scoped; EntityList default snippet renamed to DefaultTitle, EditableItemsList to ItemActions; Boundary and Bits UI keep framework-constrained names (pending/failed, child/children). Rules documented in .cursor/rules/svelte-snippet-patterns.mdc.
