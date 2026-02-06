<script lang="ts">


	// Types/constants
	import type { Snippet } from 'svelte'


	// Props
	let {
		content = '',
		triggerLabel = '',
		triggerProps = {},
		contentProps = {},
		portalProps = {},
		Trigger,
		Content,
		children,
		...rootProps
	}: {
		content?: string,
		triggerLabel?: string,
		triggerProps?: Record<string, unknown>,
		contentProps?: Record<string, unknown>,
		portalProps?: Record<string, unknown>,
		Trigger?: Snippet,
		Content?: Snippet,
		children?: Snippet,
		[key: string]: unknown,
	} = $props()


	// Components
	import { Tooltip } from 'bits-ui'
</script>


<Tooltip.Root {...rootProps}>
	<Tooltip.Trigger {...triggerProps}>
		{#if Trigger}
			{@render Trigger()}
		{:else if children}
			{@render children()}
		{:else}
			<span>{triggerLabel}</span>
		{/if}
	</Tooltip.Trigger>
	{#if Content || content}
		<Tooltip.Portal {...portalProps}>
			<Tooltip.Content {...contentProps}>
				{#if Content}
					{@render Content()}
				{:else}
					{content}
				{/if}
				<Tooltip.Arrow />
			</Tooltip.Content>
		</Tooltip.Portal>
	{/if}
</Tooltip.Root>
