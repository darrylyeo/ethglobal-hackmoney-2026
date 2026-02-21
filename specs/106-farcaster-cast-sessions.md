# Spec 106: Farcaster cast sessions – architecture alignment and drafting

Verify Farcaster accounts are architected similarly to watching blockchain accounts, with enums for available transports. Based on transports, enable drafting/creating casts and replying. Cast session management and structure parallel the actions feature and collections/components.

## References

- Spec 084: Watched entities (sole source for nav)
- Spec 093: Watched entities typed entity id
- Spec 104: Farcaster accounts (transport enum, SIWF vs Watch)
- Spec 046: Transaction sessions (session lifecycle, collections)
- Spec 082: Session and action component structure
- Spec 101: Session URL model (template, persist on first edit)

## Scope

1. **Verify** Farcaster accounts mirror blockchain accounts architecture.
2. **Transport-based capabilities** – Siwf enables drafting; Watch is read-only.
3. **Cast sessions** – parallel to transaction sessions: collection, URL model, components.
4. **Draft/create casts**, **reply to cast** – enabled only for `FarcasterConnectionTransport.Siwf`.

## Non-goals

- Farcaster Hub signing integration (Neynar/relay publish) – this spec defines the data model and UI structure; implementation can stub or integrate later.
- Cast reactions (like, recast) – out of scope.

---

## 1. Architecture verification: Farcaster accounts vs blockchain accounts

### Blockchain accounts (existing)

| Aspect | Implementation |
|--------|----------------|
| **Source** | `watchedEntitiesCollection` + `walletConnectionsCollection` |
| **Entity type** | `EntityType.Actor` |
| **Transport enum** | `WalletConnectionTransport` (Eip1193, None) |
| **Nav section** | Accounts (Explore > Accounts or top-level) |
| **Nav children** | Per watched actor; tag from transport (Connected, Watching) |
| **Capabilities** | Eip1193: sign transactions; None: read-only |

### Farcaster accounts (spec 104, verify alignment)

| Aspect | Implementation |
|--------|----------------|
| **Source** | `farcasterConnectionsCollection` |
| **Entity type** | `EntityType.FarcasterUser` (derived; connections use `fid`) |
| **Transport enum** | `FarcasterConnectionTransport` (Siwf, Watch) |
| **Nav section** | Farcaster → Accounts |
| **Nav children** | Per connection; tag from transport (Signed in, Watching) |
| **Capabilities** | Siwf: draft/post casts; Watch: read-only |

### Alignment checklist

- [x] `FarcasterConnectionTransport` enum exists (Siwf, Watch).
- [x] Connections collection is profile-scoped, localStorage.
- [x] Nav: Farcaster → Accounts with flattened children per connection.
- [x] Tag per account: `Signed in` or `Watching` from transport.
- [x] Siwf = authenticated (can post); Watch = read-only (cannot post).

---

## 2. Transport enum and capabilities

### `FarcasterConnectionTransport` (existing in `$/data/FarcasterConnection.ts`)

```typescript
export enum FarcasterConnectionTransport {
  Siwf = 'siwf',   // authenticated; can draft and post casts
  Watch = 'watch',  // read-only; cannot post
}
```

### Capability matrix

| Transport | View casts | Draft/create cast | Reply to cast |
|-----------|------------|-------------------|---------------|
| Siwf | ✓ | ✓ | ✓ |
| Watch | ✓ | ✗ | ✗ |

**UI rule:** Draft/reply controls visible only when `selectedConnection?.transport === FarcasterConnectionTransport.Siwf`.

---

## 3. Cast session model (parallel to transaction sessions)

### Social post action types (generified; protocol: Farcaster)

```typescript
// $/constants/social-post-actions.ts
export enum SocialProtocol { Farcaster = 'Farcaster' }

export enum SocialPostActionType {
  CreatePost = 'CreatePost',
  ReplyToPost = 'ReplyToPost',
}
```

Mirrors `ActionType`, `actionTypeDefinitions`, etc. from `$/constants/actions.ts`.

### Social post session

```typescript
// $/data/SocialPostSession.ts
export type SocialPostSession = {
  id: string
  name?: string
  actions: SocialPostAction[]
  status: SocialPostSessionStatus
  protocol: SocialProtocol  // Farcaster
  authorId: number  // fid for Farcaster
  createdAt: number
  updatedAt: number
  lockedAt?: number
  params: Record<string, unknown>  // text, parentFid, parentHash, parentUrl, embeds, etc.
  execution?: {
    submittedAt: number
    castHash?: `0x${string}`
  }
  finalization?: { at: number; castId?: FarcasterCast$Id }
}

export enum SocialPostSessionStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  Finalized = 'Finalized',
}

export type SocialPostAction = {
  type: SocialPostActionType
  params: Record<string, unknown>
}
```

### Params schema (parallel to actions.ts)

- **CreatePost**: `{ text: string, embeds?: { url?: string }[], parentUrl?: string }`
- **ReplyToPost**: `{ text: string, parentFid: number, parentHash: \`0x${string}\`, parentUrl?: string }`

---

## 4. Collections and data flow

### Social post sessions collection

- **ID:** `CollectionId.SocialPostSessions` (in `$/constants/collections.ts`)
- **Storage:** localStorage, profile-scoped.
- **Key:** `row.id`
- **API:** `createSocialPostSession`, `updateSocialPostSession`, `getSocialPostSession`, `deleteSocialPostSession`

### Watched social post sessions

Social post sessions can be watched via `watchedEntitiesCollection` with `EntityType.SocialPostSession` in `$EntityType.ts` and `deriveWatchedEntityRow`. Nav shows social post sessions under Farcaster.

---

## 5. URL model (parallel to spec 101)

### Local session

- **Route:** `/farcaster/session`
- **Query params:** `?template=CreatePost` | `?template=ReplyToPost` | `?session={devalue}`
- **Bootstrap:** Ephemeral session from template; persist on first form interaction.
- **Redirect:** On persist → `/farcaster/session/[id]`.

### Persisted session

- **Route:** `/farcaster/session/[id]`
- Load from `socialPostSessionsCollection`; edits sync.

---

## 6. Component structure (parallel to spec 082)

### Routes

```
/farcaster/session +page.svelte       (local; template bootstrap)
/farcaster/session/[id] +page.svelte (persisted; load by id)
/farcaster/actions +page.svelte       (optional; pick CreateCast / ReplyToCast, like /actions)
```

### Component tree

```
/farcaster/session +page.svelte
└─ <SocialPostSession bind:session>   (parallel to Session.svelte)
   ├─ header: editable name, <FarcasterAccountSelect> (selected Siwf connection)
   └─ <SocialPostActionsSequence bind:actions={session.actions}>
      └─ <EditableItemsList> (single action for MVP)
         └─ <SocialPostAction bind:action>
            ├─ <Select> for SocialPostActionType
            └─ Params column (text input, parent ref for reply)
```

### FarcasterAccountSelect

- Lists connections where `transport === FarcasterConnectionTransport.Siwf`.
- Filters out Watch connections for drafting (or shows them disabled with tooltip “Sign in to draft”).
- Mirrors `AccountsSelect` pattern for blockchain.

---

## 7. Nav and actions entry points

### Farcaster nav structure

| Item | href | Notes |
|------|------|-------|
| Farcaster (parent) | /farcaster | Dashboard or channels |
| Accounts | /farcaster/accounts | List connections |
| Social posts | /farcaster/sessions | List watched social post sessions (parallel to /sessions) |
| Create post | /farcaster/session?template=CreatePost | Entry for new post |
| Reply to post | /farcaster/session?template=ReplyToPost | Entry for reply; params may include parent |

### Watched social post sessions in nav

When a social post session is watched (via WatchButton on session page):

- Nav: Farcaster → Social posts → [session name]
- Tag: Draft | Submitted | Finalized

---

## 8. API surface (stub or integrate)

Publish requires Hub/Neynar integration. For this spec:

- Define `publishCast(params)` in `$/api/farcaster/publish.ts`.
- Signature: `(params: { fid, text, parentFid?, parentHash?, embeds? }) => Promise<{ hash }>`.
- Implementation: stub returning mock hash, or call Neynar/Hub publish when available.

---

## Acceptance criteria

### Architecture verification

- [x] Farcaster accounts use `FarcasterConnectionTransport` enum; Siwf vs Watch semantics documented.
- [x] Nav: Farcaster → Accounts with flattened children per connection; tag from transport.

### Transport-based capabilities

- [x] Draft/create and reply controls enabled only when selected Farcaster connection has `transport === FarcasterConnectionTransport.Siwf`.

### Social post sessions

- [x] `SocialPostActionType` enum and `socialPostActionTypeDefinitions` in `$/constants/social-post-actions.ts`.
- [x] `SocialPostSession` type and `SocialPostSessionStatus` in `$/data/SocialPostSession.ts`.
- [x] `socialPostSessionsCollection` in `$/collections/SocialPostSessions.ts`; `CollectionId.SocialPostSessions` in collections.ts.
- [x] Routes: `/farcaster/session`, `/farcaster/session/[id]`; URL bootstrap parallel to spec 101.

### Components

- [x] `SocialPostSession.svelte`, `SocialPostActionsSequence.svelte`, `SocialPostAction.svelte` in `src/routes/farcaster/session/`.
- [x] `FarcasterAccountSelect` (or equivalent) for selecting Siwf connection when drafting.
- [x] `EditableItemsList` for social post actions; CreatePost and ReplyToPost params forms.

### Nav

- [x] Farcaster → Social posts (or Create post / Reply) entry points.
- [x] Watched social post sessions appear as nav children when applicable.

### API

- [x] `publishCast` (or equivalent) defined; stub or integration as needed.

---

## Status

Complete. All acceptance criteria verified: FarcasterConnectionTransport (Siwf/Watch) in FarcasterConnection.ts; nav Farcaster → Accounts with flattened children and tag from transport; draft/reply gated by Siwf in SocialPostSession.svelte and FarcasterAccountSelect; SocialPostActionType and socialPostActionTypeDefinitions in social-post-actions.ts; SocialPostSession and SocialPostSessionStatus in SocialPostSession.ts; socialPostSessionsCollection and CollectionId; routes /farcaster/session, [id], sessions; SocialPostSession.svelte, SocialPostActionsSequence.svelte, SocialPostAction.svelte; EditableItemsList for actions; Create post / Reply nav entry points; watched sessions as nav children; publishCast in api/farcaster/publish.ts.
