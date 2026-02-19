<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import {
		SwapProtocolId,
		swapIdToProtocol,
		swapProtocolIdsWithDef,
	} from '$/constants/swap-protocol-intents.ts'
	import { spandexQuoteStrategies } from '$/constants/spandex-quote-strategies.ts'
	import {
		labelByProtocolStrategy,
		ProtocolStrategy,
		protocolsById,
	} from '$/constants/protocols.ts'
	import type { ProtocolDefinition } from '$/constants/protocols.ts'

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
					swapStrategy: string
			  })
			: null,
	)
	const swapProtocolIntent = $derived(
		(p?.swapProtocolIntent as SwapProtocolId) ?? SwapProtocolId.Auto,
	)
	const swapStrategy = $derived(
		(p?.swapStrategy as ProtocolStrategy) ?? ProtocolStrategy.BestPrice,
	)

	const protocolDef = (id: SwapProtocolId): ProtocolDefinition | null =>
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

	const setSwapStrategy = (value: string) => {
		if (action.type !== ActionType.Swap || typeof value !== 'string') return
		if (!spandexQuoteStrategies.includes(value as (typeof spandexQuoteStrategies)[number])) return
		action = {
			...action,
			params: { ...action.params, swapStrategy: value },
		} as Action
	}
</script>


{#if action.type === ActionType.Swap}
	<div data-column="gap-2">
		{#each rows as row (row.id)}
			{#if row.type === 'auto'}
				<div
					class="protocol-row"
					data-card="radius-6 padding-3"
					data-row="gap-2 align-center wrap"
					data-selected={swapProtocolIntent === SwapProtocolId.Auto ? '' : undefined}
				>
					<button
						type="button"
						class="protocol-row-main"
						data-row="gap-2 align-center"
						onclick={() => setSwapProtocolIntent(SwapProtocolId.Auto)}
					>
						Auto
					</button>
					{#if swapProtocolIntent === SwapProtocolId.Auto}
						<span>Strategy</span>
						<Select
							items={spandexQuoteStrategies}
							getItemId={(s) => s}
							getItemLabel={(s) => labelByProtocolStrategy[s] ?? s}
							bind:value={() => swapStrategy, (v: string | string[] | undefined) => {
								const s = typeof v === 'string' ? v : (Array.isArray(v) ? v[0] : '')
								if (s && spandexQuoteStrategies.includes(s as (typeof spandexQuoteStrategies)[number]))
									setSwapStrategy(s)
							}}
							ariaLabel="Strategy"
						/>
					{/if}
				</div>
			{:else if row.def}
				<div
					class="protocol-row"
					data-card="radius-6 padding-3"
					data-row="gap-2 align-center wrap"
					data-selected={swapProtocolIntent === row.id ? '' : undefined}
				>
					<button
						type="button"
						class="protocol-row-main"
						data-row="gap-2 align-center"
						onclick={() => setSwapProtocolIntent(row.id)}
					>
						{#if row.def.icon.includes('/')}
							<Icon class="protocol-icon" src={row.def.icon} size={20} alt="" />
						{:else}
							<Icon class="protocol-icon" icon={row.def.icon} size={20} alt="" />
						{/if}
						<div data-column="gap-2">
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
