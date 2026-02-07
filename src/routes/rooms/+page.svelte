<script lang="ts">


	// Context
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'


	// Functions
	import { createRoom, normalizeRoomInput } from '$/lib/rooms/room.ts'


	// State
	let joinCode = $state('')
	let creating = $state(false)
	let joining = $state(false)


	// Actions
	const handleCreate = () => {
		creating = true
		createRoom()
			.then((roomId) => {
				goto(resolve(`/rooms/${encodeURIComponent(roomId)}`))
			})
			.finally(() => {
				creating = false
			})
	}

	const handleJoin = () => {
		const roomId = normalizeRoomInput(joinCode)
		if (!roomId) return
		joining = true
		goto(resolve(`/rooms/${roomId}`))
		joining = false
	}
</script>


<svelte:head>
	<title>Rooms</title>
</svelte:head>


<main
	id="main"
	data-sticky-container
	data-column
>
	<h1>Rooms</h1>

	<div
		data-scroll-item
		data-row
	>
		<section
			data-row-item="flexible"
			data-card
		>
			<h2>Create room</h2>
			<button
				type="button"
				disabled={creating}
				onclick={handleCreate}
			>
				{creating ? 'Creating…' : 'Create room'}
			</button>
		</section>

		<section
			data-row-item="flexible"
			data-card
		>
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
					placeholder="ID or display name"
					bind:value={joinCode}
					maxlength="80"
					aria-label="Room code"
				/>
				<button
					type="submit"
					disabled={joining || !joinCode.trim()}
				>
					{joining ? 'Joining…' : 'Join'}
				</button>
			</form>
		</section>
	</div>
</main>

