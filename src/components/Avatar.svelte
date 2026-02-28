<script lang="ts">
	// Types/constants
	type SubiconProps = {
		icon?: string
		html?: string
		src?: string
		alt?: string
		size?: number | string
	}


	// Props
	let {
		name,
		emoji,
		size = '2rem',
		subicon,
	}: {
		name: string
		emoji: string
		size?: string
		subicon?: SubiconProps
	} = $props()


	// Functions
	import { peerNameToHue } from '$/lib/rooms/room.ts'


	// Components
	import Icon from '$/components/Icon.svelte'
</script>


<span
	class="avatar"
	role="img"
	aria-label={name}
	style="
		--size: {size};
		--bg: oklch(0.65 0.2 {peerNameToHue(name)});
	"
>
	{emoji}

	{#if subicon}
		<span class="avatar-subicon">
			<Icon
				{...subicon}
				size={subicon.size ?? '50%'}
			/>
		</span>
	{/if}
</span>


<style>
	.avatar {
		position: relative;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		font-size: calc(var(--size) * 0.5);
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg);
		flex-shrink: 0;
	}

	.avatar-subicon {
		position: absolute;
		inset-block-end: 0;
		inset-inline-end: 0;
	}
</style>
