<script lang="ts">
	// Types/constants
	import {
		createSiwfChannel,
		getSiwfStatus,
		verifySiwfCompleted,
		type SiwfStatusCompleted,
	} from '$/api/siwf.ts'
	import {
		clearFarcasterAuthUser,
		getFarcasterAuthUser,
		setFarcasterAuthUser,
		subscribeFarcasterAuth,
		type FarcasterAuthUser,
	} from '$/state/farcaster-auth.svelte.ts'
	import { addFarcasterConnectionSiwf } from '$/collections/FarcasterConnections.ts'
	import { ensureFarcasterUser } from '$/collections/FarcasterUsers.ts'

	// Components
	import Qr from '$/components/Qr.svelte'


	// Props
	let {
		domain,
		siweUri,
		buttonOnly = false,
	}: {
		domain: string
		siweUri: string
		buttonOnly?: boolean
	} = $props()


	// State
	let user = $state<FarcasterAuthUser | null>(getFarcasterAuthUser())

	$effect(() => {
		const unsub = subscribeFarcasterAuth(() => {
			user = getFarcasterAuthUser()
		})
		return unsub
	})
	let status = $state<'idle' | 'pending' | 'error'>('idle')
	let channelUrl = $state<string | null>(null)
	let errorMessage = $state<string | null>(null)

	const pollInterval = 1500
	let pollTimer = $state<ReturnType<typeof setInterval> | null>(null)


	// Actions
	const signIn = async () => {
		status = 'pending'
		errorMessage = null
		channelUrl = null
		try {
			const channel = await createSiwfChannel(domain, siweUri)
			channelUrl = channel.url
			const poll = async () => {
				const s = await getSiwfStatus(channel.channelToken)
				if (s.state === 'completed') {
					if (pollTimer) {
						clearInterval(pollTimer)
						pollTimer = null
					}
					await completeSignIn(s)
					return
				}
			}
			await poll()
			if (status === 'pending') pollTimer = setInterval(poll, pollInterval)
		} catch (e) {
			status = 'error'
			errorMessage = e instanceof Error ? e.message : String(e)
		}
	}

	const completeSignIn = async (s: SiwfStatusCompleted) => {
		if (!s.fid) return
		try {
			await verifySiwfCompleted(s)
		} catch (e) {
			status = 'error'
			errorMessage = e instanceof Error ? e.message : 'Verification failed'
			return
		}
		const authUser: FarcasterAuthUser = {
			fid: s.fid,
			username: s.username,
			displayName: s.displayName,
			pfpUrl: s.pfpUrl,
			bio: s.bio,
			verifications: s.verifications,
			custody: s.custody,
			authMethod: s.authMethod,
			signedAt: Date.now(),
		}
		setFarcasterAuthUser(authUser)
		addFarcasterConnectionSiwf(authUser)
		user = authUser
		status = 'idle'
		channelUrl = null
		ensureFarcasterUser(s.fid).catch(() => {})
	}

	const signOut = () => {
		clearFarcasterAuthUser()
		user = null
		if (pollTimer) {
			clearInterval(pollTimer)
			pollTimer = null
		}
		channelUrl = null
		status = 'idle'
	}

	$effect(() => {
		return () => {
			if (pollTimer) clearInterval(pollTimer)
		}
	})
</script>

<div data-column="gap-2">
	{#if user && !buttonOnly}
		<div data-row="gap-2 align-center">
			{#if user.pfpUrl}
				<img
					src={user.pfpUrl}
					alt=""
					width="32"
					height="32"
					style="border-radius: 50%"
				/>
			{/if}
			<span>@{user.username ?? user.fid}</span>
			<button type="button" onclick={signOut}>Sign out</button>
		</div>
	{:else}
		{#if status === 'pending' && channelUrl}
			<div data-column="gap-2">
				<p data-text="annotation">Scan with Warpcast or open link:</p>
				<Qr value={channelUrl} size={200} />
				<a href={channelUrl} target="_blank" rel="noopener noreferrer">
					Sign in with Farcaster
				</a>
			</div>
		{:else}
			<button
				type="button"
				disabled={status === 'pending'}
				onclick={signIn}
			>
				{status === 'pending' ? 'Waiting for approval…' : 'Sign in with Farcaster'}
			</button>
		{/if}
		{#if errorMessage}
			<p data-text="muted">{errorMessage}</p>
		{/if}
	{/if}
</div>
