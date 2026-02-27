<script lang="ts">
	// Types/constants
	import type { Profile } from '$/lib/profile.ts'

	// Props
	let {} = $props()

	// Functions
	import { formatRelativeTime } from '$/lib/formatRelativeTime.ts'
	import {
		createProfile,
		deleteProfile,
		exportProfile,
		getActiveProfile,
		importProfile,
		listProfiles,
		switchProfile,
		updateProfile,
	} from '$/lib/profile.ts'

	// State
	import { getNetworkEnvironment } from '$/state/network-environment.svelte.ts'
	let activeProfile = $state(
		getActiveProfile(),
	)
	let editingEmoji = $state(
		'',
	)
	let editingId = $state<string | undefined>(
		undefined,
	)
	let editingName = $state(
		'',
	)
	let importError = $state<string | null>(
		null,
	)
	let profiles = $state(
		listProfiles(),
	)


	// Actions
	const refresh = () => {
		profiles = listProfiles()
		activeProfile = getActiveProfile()
	}

	const onSwitch = (id: string) => {
		switchProfile(id, getNetworkEnvironment())
		refresh()
	}

	const onCreate = () => {
		const profile = createProfile()
		switchProfile(profile.id, getNetworkEnvironment())
		refresh()
	}

	const onExport = (id: string) => {
		exportProfile(id)
	}

	const onDelete = (id: string) => {
		if (profiles.length <= 1) return
		deleteProfile(id, getNetworkEnvironment())
		refresh()
	}

	const startEditing = (profile: Profile) => {
		editingId = profile.id
		editingName = profile.name
		editingEmoji = profile.emoji
	}

	const finishEditing = () => {
		if (editingId) {
			updateProfile(editingId, { name: editingName.trim(), emoji: editingEmoji.trim() })
			refresh()
		}
		editingId = undefined
	}

	const onImport = () => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = '.json,.blockhead.json'
		input.onchange = async () => {
			const file = input.files?.[0]
			if (!file) return
			importError = null
			try {
				const profile = await importProfile(file)
				refresh()
				onSwitch(profile.id)
			} catch (e) {
				importError = e instanceof Error ? e.message : String(e)
			}
		}
		input.click()
	}


	// Components
	import Avatar from '$/components/Avatar.svelte'
</script>


<main data-column>
	<h1>Profiles</h1>

	<p class="muted">
		Profiles isolate local state (sessions, watched entities, wallet connections).
		Switch between profiles in the nav footer.
	</p>

	{#if importError}
		<p class="error" role="alert">{importError}</p>
	{/if}

	<ul class="profile-list" role="list">
		{#each profiles as profile (profile.id)}
			<li
				class="profile-row"
				data-active={profile.id === activeProfile.id ? '' : undefined}
			>
				{#if editingId === profile.id}
					<form
						class="profile-edit-form"
						onsubmit={(e) => {
							e.preventDefault()
							finishEditing()
						}}
					>
						<Avatar name={editingName} emoji={editingEmoji} size="2rem" />
						<input
							type="text"
							bind:value={editingName}
							placeholder="Name"
							class="profile-edit-input"
						/>
						<input
							type="text"
							bind:value={editingEmoji}
							placeholder="Emoji"
							class="profile-edit-input profile-edit-emoji"
							maxlength="2"
						/>
						<span class="profile-actions">
							<button type="submit">Save</button>
							<button
								type="button"
								onclick={() => { editingId = undefined }}
							>
								Cancel
							</button>
						</span>
					</form>
				{:else}
					<button
						type="button"
						class="profile-switch"
						onclick={() => onSwitch(profile.id)}
					>
						<Avatar name={profile.name} emoji={profile.emoji} size="2rem" />
						<span class="profile-info">
							<span class="profile-name">{profile.name}</span>
							<time
								datetime={new Date(profile.createdAt).toISOString()}
								class="profile-created"
							>
								{formatRelativeTime(Date.now() - profile.createdAt)}
							</time>
						</span>
						{#if profile.id === activeProfile.id}
							<span data-tag>Active</span>
						{/if}
					</button>
					<span class="profile-actions">
						<button
							type="button"
							aria-label="Rename {profile.name}"
							onclick={() => startEditing(profile)}
						>
							&#x270E;
						</button>
						<button
							type="button"
							aria-label="Export {profile.name}"
							onclick={() => onExport(profile.id)}
						>
							&#x21E9;
						</button>
						{#if profiles.length > 1}
							<button
								type="button"
								aria-label="Delete {profile.name}"
								onclick={() => onDelete(profile.id)}
							>
								&#x2715;
							</button>
						{/if}
					</span>
				{/if}
			</li>
		{/each}
	</ul>

	<div class="profile-actions-row">
		<button type="button" onclick={onCreate}>
			+ New Profile
		</button>
		<button type="button" onclick={onImport}>
			Import profile
		</button>
	</div>
</main>

<style>
	.muted {
		color: var(--color-fg-muted);
		font-size: 0.875rem;
	}

	.error {
		color: var(--color-error);
		padding: 0.5rem;
		background: color-mix(in oklch, var(--color-error) 15%, transparent);
		border-radius: 0.25rem;
	}

	.profile-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.profile-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		border-radius: 0.375rem;
		background: var(--card-backgroundColor);
		border: 1px solid var(--border-color);
	}

	.profile-row[data-active] {
		outline: 2px solid var(--accent-color);
	}

	.profile-switch {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		text-align: start;
		cursor: pointer;
	}

	.profile-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.profile-name {
		font-weight: 500;
	}

	.profile-created {
		font-size: 0.75rem;
		color: var(--color-fg-muted);
	}

	.profile-edit-form {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		flex-wrap: wrap;
	}

	.profile-edit-input {
		font: inherit;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: 0.25rem;
		background: var(--color-bg);
		color: inherit;
	}

	.profile-edit-emoji {
		width: 3rem;
	}

	.profile-actions {
		display: flex;
		gap: 0.25rem;
	}

	.profile-actions button {
		padding: 0.25rem;
		border: none;
		background: none;
		color: var(--color-fg-muted);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.profile-actions button:hover {
		color: var(--color-fg);
	}

	.profile-actions-row {
		display: flex;
		gap: 0.5rem;
	}
</style>
