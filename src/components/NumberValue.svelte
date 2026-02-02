<script lang="ts">
	// Props
	let {
		value,
		options = {},
	}: {
		value: number | bigint
		options?: Intl.NumberFormatOptions
	} = $props()


	// Derived
	const numberValue = $derived(
		Number(value)
	)

	const formatter = $derived(
		new Intl.NumberFormat(
			undefined,
			{
				// minimumFractionDigits: 2,
				// maximumFractionDigits: 6,
				// ...options,
			}
		)
	)

	const parts = $derived(
		formatter.formatToParts(numberValue)
	)
</script>


<output>
	{#each parts as part}
		<span class:part-fraction={part.type === 'fraction'} class:part-currency={part.type === 'currency'} class:part-group={part.type === 'group'}>{part.value}</span>
	{/each}
</output>


<style>
	.part-fraction {
		opacity: 0.6;
	}

	.part-currency {
		font-weight: 600;
	}

	.part-group {
		opacity: 0.4;
	}
</style>
