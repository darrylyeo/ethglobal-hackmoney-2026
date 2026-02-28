<script module lang="ts">
	import { ensureProfilesMeta } from '$/lib/profile.ts'
	ensureProfilesMeta()
</script>


<script lang="ts">
	// Types/constants
	import type { Profile } from '$/lib/profile.ts'

	// Context
	import { goto } from '$app/navigation'

	// Functions
	import {
		createProfile,
		deleteProfile,
		exportProfile,
		getActiveProfile,
		listProfiles,
		switchProfile,
		updateProfile,
	} from '$/lib/profile.ts'

	// State
	import { getNetworkEnvironment } from '$/state/network-environment.svelte.ts'
	let activeProfile = $state(
		getActiveProfile()
	)
	let editingId = $state<string | undefined>(
		undefined,
	)
	let editingName = $state(
		''
	)
	let profiles = $state(
		listProfiles()
	)

	// Actions
	const refresh = () => {
		activeProfile = getActiveProfile()
		profiles = listProfiles()
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
	}
	const finishEditing = () => {
		if (editingId && editingName.trim()) {
			updateProfile(editingId, { name: editingName.trim() })
			refresh()
		}
		editingId = undefined
	}

	// Components
	import { DropdownMenu } from 'bits-ui'
	import Avatar from '$/components/Avatar.svelte'
</script>


<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class="profile-trigger"
		aria-label="Switch profile"
	>
		<Avatar
			name={activeProfile.name}
			emoji={activeProfile.emoji}
			size="1.5rem"
		/>
		<span class="profile-name">{activeProfile.name}</span>
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content
			class="profile-menu"
			side="top"
			sideOffset={8}
		>
			<DropdownMenu.Group>
				<DropdownMenu.Item disabled data-dropdown-label>
					Profiles
				</DropdownMenu.Item>

				{#each profiles as profile (profile.id)}
					<DropdownMenu.Item
						data-active={profile.id === activeProfile.id ? '' : undefined}
						onclick={() => onSwitch(profile.id)}
					>
						{#if editingId === profile.id}
							<!-- svelte-ignore a11y_autofocus -->

							<input
								class="profile-edit-input"
								bind:value={editingName}
								onblur={finishEditing}
								onkeydown={(e) => {
									if (e.key === 'Enter') finishEditing()
									if (e.key === 'Escape') { editingId = undefined }
								}}
								onclick={(e) => e.stopPropagation()}
								autofocus
							/>
						{:else}
							<span data-row="align-center">
								<Avatar
									name={profile.name}
									emoji={profile.emoji}
									size="1.25rem"
								/>
								<span>{profile.name}</span>
								{#if profile.id === activeProfile.id}
									<span data-tag>Active</span>
								{/if}
							</span>

							<span class="profile-actions" data-row="gap-1">
								<button
									type="button"
									aria-label="Rename {profile.name}"
									onclick={(e) => { e.stopPropagation(); startEditing(profile) }}
								>
									&#x270E;
								</button>

								<button
									type="button"
									aria-label="Export {profile.name}"
									onclick={(e) => { e.stopPropagation(); onExport(profile.id) }}
								>
									&#x21E9;
								</button>

								{#if profiles.length > 1}
									<button
										type="button"
										aria-label="Delete {profile.name}"
										onclick={(e) => { e.stopPropagation(); onDelete(profile.id) }}
									>
										&#x2715;
									</button>
								{/if}
							</span>
						{/if}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>

			<DropdownMenu.Separator />

			<DropdownMenu.Item
				onclick={onCreate}
			>
				+ New Profile
			</DropdownMenu.Item>

			<DropdownMenu.Item
				onclick={() => goto('/settings/profiles')}
			>
				Manage profiles
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>


<style>
	:global(.profile-trigger) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		cursor: pointer;
		width: 100%;
		border: none;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: start;

		&:hover {
			background: var(--accent-backgroundColor);
		}
	}

	.profile-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.profile-edit-input {
		font: inherit;
		padding: 0.125rem 0.25rem;
		border: 1px solid var(--border-color);
		border-radius: 0.25rem;
		background: var(--color-bg);
		color: inherit;
		width: 100%;
	}

	.profile-actions {
		margin-inline-start: auto;
		flex-shrink: 0;

		button {
			background: none;
			border: none;
			padding: 0.125rem;
			cursor: pointer;
			color: var(--color-fg-muted);
			font-size: 0.75rem;
			line-height: 1;

			&:hover {
				color: var(--color-fg);
			}
		}
	}
</style>
