# Spec 075: Format command

When the user says **"format"** (or "format the code", "format my changes", etc.), apply repository formatting to the requested scope. Source of truth: `.cursor/agents/formatter.md` and specs 041, 056.

## Scope

- Apply formatting only to files in scope (files changed in the conversation, or paths the user specifies). If no files were changed, ask which path to format or use the file(s) currently in context.
- Manual formatting to repo preferences; run `deno task format` for Svelte section spacing. Do not run Prettier or any other formatter.

## Execution

1. **Scope:** Every file changed or created in the conversation (or user-specified paths).
2. **Manual formatting:** Fix each file to match repo preferences per formatter.md: TypeScript (single quotes, no statement semicolons, implicit returns, inline single-use vars/types, multi-line and ternary style, extensions in imports), Svelte (section order, two empty lines between sections and comment groups, one prop per line, Svelte 5 only), CSS (semicolons, semantic selectors, data-attribute variants). Inline all single-use variables and types.
3. **Section spacing:** Run `deno task format` so the script enforces exactly two blank lines between Svelte sections and between comment groups in `<script>`.

## Acceptance criteria

- [x] On "format", scope is defined (changed files or user path).
- [x] Each file in scope is formatted by hand to formatter.md / specs 041, 056.
- [x] `deno task format` is run so Svelte section spacing is applied.
- [x] No Prettier or other formatter is run.

## Status

Complete. `.cursor/rules/format.mdc` defines scope (changed files or user path), manual formatting to formatter.md/specs 041 and 056, and running `deno task format` for Svelte section spacing; it explicitly forbids Prettier and other formatters. `.cursor/agents/formatter.md` holds the detailed rules. Cursor rule references this spec.
