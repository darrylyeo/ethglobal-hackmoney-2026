<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import {
		SwapProtocolId,
		swapIdToProtocol,
		swapProtocolIdsWithDef,
	} from '$/constants/swap-protocol-intents.ts'
	import {
		protocolAggregatorIds,
		protocolStrategies,
		protocolAggregatorsById,
		protocolsById,
		ProtocolAggregatorId,
		ProtocolStrategy,
	} from '$/constants/protocols.ts'
	import type { Protocol } from '$/constants/protocols.ts'

	// Components
	import Icon from '$/components/Icon.svelte'
	import Select from '$/components/Select.svelte'


	// Props
	let {
		action = $bindable(),
	}: {
		action: Action
	} = $props()


	// (Derived)
	const p = $derived(
		action.type === ActionType.Swap
			? (action.params as {
					swapProtocolIntent: string
					swapAggregator: string
					swapStrategy: string
			  })
			: null,
	)
	const swapProtocolIntent = $derived(
		(p?.swapProtocolIntent as SwapProtocolId) ?? SwapProtocolId.Auto,
	)
	const swapAggregator = $derived(
		(p?.swapAggregator as ProtocolAggregatorId) ?? ProtocolAggregatorId.Spandex,
	)
	const swapStrategy = $derived(
		(p?.swapStrategy as ProtocolStrategy) ?? ProtocolStrategy.BestPrice,
	)
	const strategiesForAggregator = $derived(
		protocolAggregatorsById[swapAggregator]?.strategies ?? [],
	)

	const protocolDef = (id: SwapProtocolId): Protocol | null =>
		swapIdToProtocol[id] ? protocolsById[swapIdToProtocol[id]!] ?? null : null

	const rows = $derived(
		swapProtocolIdsWithDef.map(({ id }) => ({
			type: id === SwapProtocolId.Auto ? ('auto' as const) : ('protocol' as const),
			id,
			def: protocolDef(id),
		})),
	)


	// Actions
	const setSwapProtocolIntent = (value: SwapProtocolId) => {
		if (action.type !== ActionType.Swap) return
		action = {
			...action,
			params: {
				...action.params,
				swapProtocolIntent: value,
			},
			protocolAction:
				value !== SwapProtocolId.Auto && swapIdToProtocol[value]
					? { action: ActionType.Swap, protocol: swapIdToProtocol[value]! }
					: undefined,
		} as Action
	}

	const setSwapAggregator = (value: ProtocolAggregatorId) => {
		if (action.type !== ActionType.Swap) return
		action = {
			...action,
			params: { ...action.params, swapAggregator: value },
		} as Action
	}
	const setSwapStrategy = (value: ProtocolStrategy) => {
		if (action.type !== ActionType.Swap) return
		action = {
			...action,
			params: { ...action.params, swapStrategy: value },
		} as Action
	}
</script>


{#if action.type === ActionType.Swap}
	<div data-column>
		{#each rows as row (row.id)}
			{#if row.type === 'auto'}
				<div
					class="protocol-row"
					data-card="radius-6 padding-3"
					data-row="align-center wrap"
					data-selected={swapProtocolIntent === SwapProtocolId.Auto ? '' : undefined}
				>
					<button
						type="button"
						class="protocol-row-main"
						data-row="align-center"
						onclick={() => setSwapProtocolIntent(SwapProtocolId.Auto)}
					>
						Auto
					</button>
					{#if swapProtocolIntent === SwapProtocolId.Auto}
						<span>Aggregator</span>
						<Select
							items={protocolAggregatorIds}
							getItemId={(a) => a}
							getItemLabel={(a) => protocolAggregatorsById[a]?.label ?? a}
							bind:value={() => swapAggregator, (v) => {
								if (v != null && protocolAggregatorIds.includes(v))
									setSwapAggregator(v)
							}}
							ariaLabel="Aggregator"
						/>
						{#if strategiesForAggregator.length > 0}
							<span>Strategy</span>
							<Select
								items={strategiesForAggregator}
								getItemId={(s) => s}
								getItemLabel={(s) => protocolStrategies.find((d) => d.id === s)?.label ?? s}
								bind:value={() => swapStrategy, (v) => {
									if (v != null && strategiesForAggregator.includes(v))
										setSwapStrategy(v)
								}}
								ariaLabel="Strategy"
							/>
						{/if}
					{/if}
				</div>
			{:else if row.def}
				<div
					class="protocol-row"
					data-card="radius-6 padding-3"
					data-row="align-center wrap"
					data-selected={swapProtocolIntent === row.id ? '' : undefined}
				>
					<button
						type="button"
						class="protocol-row-main"
						data-row="align-center"
						onclick={() => setSwapProtocolIntent(row.id)}
					>
						{#if row.def.icon.includes('/')}
							<Icon class="protocol-icon" src={row.def.icon} size={20} alt="" />
						{:else}
							<Icon class="protocol-icon" icon={row.def.icon} size={20} alt="" />
						{/if}
						<div data-column>
							<strong>{row.def.label}</strong>
							<small data-text="muted">{row.def.detail}</small>
						</div>
					</button>
				</div>
			{/if}
		{/each}
	</div>
{/if}


<style>
	@import './protocol-fieldsets.css';
</style>
