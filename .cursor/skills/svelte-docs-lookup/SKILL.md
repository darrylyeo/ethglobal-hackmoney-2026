---
name: svelte-docs-lookup
description: When Svelte 5 or SvelteKit docs are needed, use the Svelte MCP: list-sections then get-documentation. Apply only when implementing or answering questions about Svelte/SvelteKit.
---

# Svelte docs lookup

When you need official Svelte 5 or SvelteKit documentation, use the **Svelte MCP** (do not keep it in context otherwise):

1. **list-sections** — get titles, `use_cases`, and paths
2. **get-documentation** — pass the section path(s) that match the task

Match sections by `use_cases` (e.g. runes, snippets, routing, load). After editing Svelte files, run **svelte-autofixer** on them.
