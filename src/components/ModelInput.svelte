<script lang="ts">


	// Types/constants
	import type { LlmConnectionRow } from '$/collections/llm-connections'
	import { getModelsForConnection } from '$/api/llm/connection-provider'


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
	type ModelOption = { value: string, label: string }
	const options = $derived.by((): ModelOption[] => {
		const opts: ModelOption[] = [{ value: '', label: 'Default' }]
		for (const conn of connections) {
			const models = getModelsForConnection(conn)
			for (const m of models)
				opts.push({
					value: `${conn.id}:${m.id}`,
					label: `${conn.label} · ${m.label}`,
				})
		}
		return opts
	})


	// Components
	import Select from '$/components/Select.svelte'
</script>


<Select
	{...rootProps}
	items={options}
	type="single"
	bind:value
	{placeholder}
	{disabled}
	{id}
	{ariaLabel}
	getItemId={(item) => item.value}
	getItemLabel={(item) => item.label}
></Select>
