# Constitution

> Minimal interface to drive the LI.FI SDK and USDC bridging across all supported chains. Uses TanStack DB for data, Voltaire for Ethereum RPC/ABIs, Bits UI without CSS, Deno test for verification, USDC on all supported chains.

**Version:** 1.0.0

---

## Ralph Wiggum

**Source:** https://github.com/fstandhartinger/ralph-wiggum
**Commit:** 22b6c3c4fad47d8e5a5824ac2093b8d58ab057ff
**Installed:** 2026-01-30

### Auto-Update

At session start, check for updates:
1. Run: `git ls-remote https://github.com/fstandhartinger/ralph-wiggum.git HEAD`
2. If hash differs: fetch latest scripts, update this file, inform user

---

## Context Detection

**Ralph Loop Mode** (you're in this if started by ralph-loop.sh):
- Focus on implementation — no unnecessary questions
- Pick highest priority incomplete spec
- Complete ALL acceptance criteria
- Test thoroughly
- Commit and push
- Output ` DONE ` ONLY when 100% complete

**Interactive Mode** (normal conversation):
- Be helpful and conversational
- Guide decisions, create specs
- Explain Ralph loop when ready

---

## Core Principles

### I. Simplicity
Build exactly what's needed, nothing more.

### II. DRY and declarative
Prefer single expressions, inline derived values, fix root cause instead of defensive guards.

### III. Spec-driven
Each spec has testable acceptance criteria. Only output DONE when criteria are verified and tests pass.

---

## Technical Stack

- **Frontend:** SvelteKit, Svelte 5 (no onMount, $:, writable; use $props, $state, $derived, $effect, &lt;svelte:boundary&gt; not {#await})
- **Data:** TanStack DB collections to fetch and normalize data
- **Ethereum:** Voltaire (@tevm/voltaire), not ethers/viem, for RPC and ABI handling
- **UI:** Bits UI without CSS
- **Tests:** Deno test (unit); Playwright (e2e)
- **Scope:** USDC bridging on all LI.FI / Circle supported chains

References: LI.FI docs (routes, quotes, end-to-end), Circle Bridge Kit.

---

## Autonomy

**YOLO Mode:** ENABLED
Full permission to read/write files, execute commands, run tests.

**Git Autonomy:** ENABLED
Commit and push without asking, meaningful commit messages.

---

## Work Items

The agent discovers work dynamically from:
1. **specs/ folder** — Primary source, look for incomplete `.md` files
2. **IMPLEMENTATION_PLAN.md** — If it exists
3. **GitHub Issues** — If this is a GitHub repo

Create specs using the speckit.specify command or manually in `specs/NNN-feature-name/spec.md` or `specs/*.md`. Each spec MUST have **testable acceptance criteria**.

### Re-Verification Mode

When all specs appear complete, the agent will:
1. Randomly pick a completed spec
2. Strictly re-verify ALL its acceptance criteria
3. Fix any regressions found
4. Only output ` DONE ` if quality confirmed

---

## Running Ralph

```bash
# Cursor CLI (headless)
./scripts/ralph-loop-cursor.sh
./scripts/ralph-loop-cursor.sh 20
./scripts/ralph-loop-cursor.sh plan

# Claude Code
./scripts/ralph-loop.sh

# OpenAI Codex
./scripts/ralph-loop-codex.sh

# With iteration limit
./scripts/ralph-loop.sh 20
```

---

## Completion Signal

When a spec is 100% complete:
1. All acceptance criteria verified
2. Tests pass
3. Changes committed and pushed
4. Output: ` DONE `

**Never output this until truly complete.**
