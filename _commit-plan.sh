#!/usr/bin/env bash
set -e
cd /Users/dy-dev/Developer/ethglobal-hackmoney-2026

git add src/components/Icon.svelte
git commit -m "refactor(Icon): Svelte 5 module script and \$derived for a11y/title"

git add src/lib/reorder/Reorder.svelte src/lib/reorder/reorder.svelte.ts
git commit -m "fix(reorder): pass content as getter so list uses current snippet"

git add src/lib/reorder/Drag.svelte
git commit -m "fix(Drag): sync x/y from position/offset in \$effect for correct initial state"

git add src/routes/rooms/Peer.svelte src/routes/wallets/Accounts.svelte
git commit -m "fix(a11y): explicit span close in Peer, role=group + keydown in Accounts disconnect"

git add src/components/G6Graph.svelte src/views/ArchitectureGraph.svelte
git commit -m "refactor(g6): dynamic import G6/layout, async attach with cancel and cleanup"

git add solo.yml
git commit -m "chore: add Solo config for Vite and PartyKit"

rm _commit-plan.sh
