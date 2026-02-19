<script lang="ts">
	// Types/constants
	import type {
		FarcasterConnectionRow,
		FarcasterConnectionSiwf,
		FarcasterConnectionWatch,
	} from '$/data/FarcasterConnection.ts'
	import { FarcasterConnectionTransport } from '$/data/FarcasterConnection.ts'
	import { page } from '$app/state'
	import { Button } from 'bits-ui'
	import Dropdown from '$/components/Dropdown.svelte'
	import SignInWithFarcaster from '$/components/SignInWithFarcaster.svelte'

	// Components
	import FarcasterConnection from '$/components/FarcasterConnection.svelte'

	// State
	import {
		addFarcasterConnectionWatch,
		removeFarcasterConnection,
		useFarcasterConnections,
	} from '$/collections/FarcasterConnections.ts'
	import {
		clearFarcasterAuthUser,
		getFarcasterAuthUser,
	} from '$/state/farcaster-auth.svelte.ts'
	import {
		parseFarcasterWatchInput,
		resolveFidFromWatchInput,
	} from '$/lib/farcaster-watch.ts'

	// State
	let watchFidInput = $state('')
	let watchResolveError = $state<string | null>(null)
	let watchResolving = $state(false)

	// (Derived)
	const connectionsQuery = useFarcasterConnections()
	const allConnections = $derived(
		(connectionsQuery.data ?? []).map((r) => r.row) as FarcasterConnectionRow[],
	)
	const siwfConnections = $derived(
		allConnections
			.filter((c): c is FarcasterConnectionSiwf => c.transport === FarcasterConnectionTransport.Siwf)
			.sort((a, b) => b.connectedAt - a.connectedAt),
	)
	const watchConnections = $derived(
		allConnections
			.filter((c): c is FarcasterConnectionWatch => c.transport === FarcasterConnectionTransport.Watch)
			.sort((a, b) => b.connectedAt - a.connectedAt),
	)
	const siwfDomain = $derived(page.url.hostname || 'localhost')
	const siwfUri = $derived(`${page.url.origin}/farcaster`)

	$effect(() => {
		watchFidInput
		watchResolveError = null
	})

	// Actions
	const addWatch = () => {
		const raw = watchFidInput.trim()
		if (!raw || !parseFarcasterWatchInput(raw)) return
		watchResolveError = null
		watchResolving = true
		resolveFidFromWatchInput(raw)
			.then(({ fid, profile }) => {
				addFarcasterConnectionWatch(fid, profile)
				watchFidInput = ''
			})
			.catch((e) => {
				watchResolveError = e instanceof Error ? e.message : String(e)
			})
			.finally(() => {
				watchResolving = false
			})
	}
	const signOut = (conn: FarcasterConnectionSiwf) => {
		removeFarcasterConnection(conn.$id.fid)
		if (getFarcasterAuthUser()?.fid === conn.$id.fid) clearFarcasterAuthUser()
	}
	const removeWatch = (conn: FarcasterConnectionWatch) => {
		removeFarcasterConnection(conn.$id.fid)
	}
</script>

<div data-row="wrap align-start gap-4">
	<details data-row-item="flexible" data-card="radius-4" open>
		<summary data-row="gap-2 align-center wrap">
			<div data-row>
				<div data-row="gap-2 align-center">
					<h3 class="section-heading">Signed in</h3>
					<span
						data-badge="small"
						aria-label={`${siwfConnections.length} signed-in accounts`}
					>
						{siwfConnections.length}
					</span>
				</div>
				<SignInWithFarcaster
					domain={siwfDomain}
					siweUri={siwfUri}
					buttonOnly
				/>
			</div>
		</summary>
		<ul class="list" data-column="gap-2">
			{#each siwfConnections as conn (conn.$id.fid)}
				<li>
					<FarcasterConnection
						connection={conn}
						actionLabel="Sign out"
						onAction={() => signOut(conn)}
					/>
				</li>
			{/each}
		</ul>
	</details>

	<details data-row-item="flexible" data-card="radius-4" open>
		<summary data-row="gap-2 align-center wrap">
			<div data-row>
				<div data-row="gap-2 align-center">
					<h4>Watching</h4>
					<span
						data-badge="small"
						aria-label={`${watchConnections.length} watching accounts`}
					>
						{watchConnections.length}
					</span>
				</div>
				<Dropdown
					items={[]}
					triggerLabel="+"
					triggerAriaLabel="Add watching user"
					triggerProps={{
						'data-farcaster-watch-trigger': true,
						onclick: (e: MouseEvent) => e.stopPropagation(),
					}}
					contentProps={{
						'data-farcaster-watch-popover': true,
					}}
				>
					{#snippet children()}
						<form
							class="add-form"
							data-column="gap-2"
							onsubmit={(e) => (e.preventDefault(), addWatch())}
						>
							<div data-column="gap-2">
								<div data-row="gap-2 align-center">
									<input
										type="text"
										placeholder="FID, @username, or name.eth"
										class="watch-input"
										bind:value={watchFidInput}
										aria-label="FID, Farcaster username, or ENS"
										id="farcaster-accounts-add-watch"
										disabled={watchResolving}
									/>
									<Button.Root
										type="submit"
										disabled={
											!parseFarcasterWatchInput(watchFidInput.trim()) ||
											watchResolving
										}
									>
										{watchResolving ? '…' : 'Add'}
									</Button.Root>
								</div>
								{#if watchResolveError}
									<p class="watch-error" role="alert">{watchResolveError}</p>
								{/if}
							</div>
						</form>
					{/snippet}
				</Dropdown>
			</div>
		</summary>
		<ul class="list" data-column="gap-2">
			{#each watchConnections as conn (conn.$id.fid)}
				<li>
					<FarcasterConnection
						connection={conn}
						actionLabel="Remove"
						onAction={() => removeWatch(conn)}
					/>
				</li>
			{/each}
		</ul>
	</details>
</div>

<style>
	.section-heading {
		font-size: 1rem;
		margin: 0;
	}
	.watch-input {
		min-width: 12em;
	}
	.watch-error {
		font-size: 0.875rem;
		color: var(--color-error, red);
		margin: 0;
	}
</style>
