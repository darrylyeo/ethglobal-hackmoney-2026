<script lang="ts">
	// Types/constants
	import type { LlmConnectionRow } from '$/collections/LlmConnections.ts'
	import { getModelsForConnection } from '$/api/llm/connection-provider.ts'


	// Props
	let {
		connections,
		value = $bindable(''),
		placeholder = 'Select model',
		disabled,
		id,
		ariaLabel = 'Model',
		...rootProps
	}: {
		connections: readonly LlmConnectionRow[]
		value?: string
		placeholder?: string
		disabled?: boolean
		id?: string
		ariaLabel?: string
		[key: string]: unknown
	} = $props()


	// (Derived)
	const modelItems = $derived(
		connections.flatMap((conn) =>
			getModelsForConnection(conn).map((model) => ({
				value: `${conn.id}:${model.id}`,
				label: `${conn.label} · ${model.label}`,
			})),
		),
	)
	const options = $derived(['', ...modelItems.map((item) => item.value)])


	// Components
	import Select from '$/components/Select.svelte'
</script>


<Select
	{...rootProps}
	items={options}
	bind:value
	{placeholder}
	{disabled}
	{id}
	{ariaLabel}
	getItemLabel={(item) =>
		item === ''
			? 'Default'
			: (modelItems.find((entry) => entry.value === item)?.label ?? item)}
></Select>
