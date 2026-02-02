<script lang="ts">
	// State
	import { createRoom } from '$/lib/partykit'
	import { goto } from '$app/navigation'

	let joinCode = $state('')
	let creating = $state(false)
	let joining = $state(false)

	const handleCreate = () => {
		creating = true
		createRoom()
			.then((roomId) => {
				goto(`/rooms/${roomId}`)
			})
			.finally(() => {
				creating = false
			})
	}

	const handleJoin = () => {
		const code = joinCode.trim().toUpperCase()
		if (!code) return
		joining = true
		goto(`/rooms/${code}`)
		joining = false
	}
</script>

<svelte:head>
	<title>Rooms</title>
</svelte:head>

<main id="main-content">
	<h1>Rooms</h1>

	<section data-card>
		<h2>Create room</h2>
		<button type="button" disabled={creating} onclick={handleCreate}>
			{creating ? 'Creating…' : 'Create room'}
		</button>
	</section>

	<section data-card>
		<h2>Join room</h2>
		<form
			onsubmit={(e) => {
				e.preventDefault()
				handleJoin()
			}}
			data-row="gap-2"
		>
			<label for="room-code">Room code</label>
			<input
				id="room-code"
				type="text"
				placeholder="e.g. ABC123"
				bind:value={joinCode}
				maxlength="8"
				aria-label="Room code"
			/>
			<button type="submit" disabled={joining || !joinCode.trim()}>
				{joining ? 'Joining…' : 'Join'}
			</button>
		</form>
	</section>
</main>
