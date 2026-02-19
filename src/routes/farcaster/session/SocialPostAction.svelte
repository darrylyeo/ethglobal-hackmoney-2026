<script lang="ts">
	// Types/constants
	import {
		createSocialPostAction,
		socialPostActionTypes,
		SocialPostActionType,
		type SocialPostAction,
	} from '$/constants/social-post-actions.ts'
	import Select from '$/components/Select.svelte'

	// Props
	let { action = $bindable() }: { action: SocialPostAction } = $props()

	// (Derived)
	const activeDef = $derived(
		socialPostActionTypes.find((d) => d.type === action.type),
	)

	// Actions
	const onActionTypeChange = (
		def: (typeof socialPostActionTypes)[number] | undefined,
	) => {
		if (!def) return
		action = createSocialPostAction(
			def.type,
			action.params as Record<string, unknown>,
		)
	}
</script>

<div data-column="gap-3" data-card="padding-3">
	<div data-row="gap-2 align-center">
		<Select
			items={socialPostActionTypes}
			bind:value={() => activeDef ?? undefined, (v) => onActionTypeChange(v ?? undefined)}
			getItemId={(d) => d.type}
			getItemLabel={(d) => `${d.icon} ${d.label}`}
			placeholder="Select type"
			ariaLabel="Post action type"
		/>
	</div>

	<div data-column="gap-2">
		<label for="post-text">Text</label>
		<textarea
			id="post-text"
			placeholder="What's on your mind?"
			bind:value={action.params.text}
			rows="4"
			class="post-text-input"
			aria-label="Post text"
		/>
	</div>

	{#if action.type === SocialPostActionType.ReplyToPost}
		{@const replyParams = action.params as { parentFid: number; parentHash: string }}
		<div data-row="gap-2 wrap">
			<div data-column="gap-1">
				<label for="post-parent-fid">Parent FID</label>
				<input
					id="post-parent-fid"
					type="number"
					placeholder="FID"
					bind:value={replyParams.parentFid}
					aria-label="Parent post FID"
				/>
			</div>
			<div data-column="gap-1" data-row-item="flexible">
				<label for="post-parent-hash">Parent hash</label>
				<input
					id="post-parent-hash"
					type="text"
					placeholder="0x..."
					bind:value={replyParams.parentHash}
					aria-label="Parent post hash"
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.post-text-input {
		min-width: 20em;
		resize: vertical;
	}
</style>
