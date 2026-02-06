<script lang="ts">
	import type { UniswapPosition } from '$/data/UniswapPosition'
	import {
		collectFees,
		increaseLiquidity,
		removeLiquidity,
	} from '$/api/uniswap'
	import { Button } from 'bits-ui'

	let {
		positions,
		chainId,
		provider = null,
		owner = null,
	}: {
		positions: UniswapPosition[]
		chainId: number | null
		provider?: {
			request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
		} | null
		owner?: `0x${string}` | null
	} = $props()

	const filtered = $derived(
		chainId !== null ? positions.filter((p) => p.chainId === chainId) : [],
	)

	const deadline = () => Math.floor(Date.now() / 1000) + 1200

	let increasePositionId = $state<string | null>(null)
	let increaseAmount0 = $state('0')
	let increaseAmount1 = $state('0')
	let actionError = $state<string | null>(null)
	let loadingAction = $state<string | null>(null)

	const canAct = $derived(Boolean(provider && owner))

	const doCollect = async (position: UniswapPosition) => {
		if (!provider || !owner) return
		actionError = null
		loadingAction = position.id
		try {
			await collectFees({
				provider,
				positionId: position.id,
				recipient: owner,
				amount0Max: position.token0Owed,
				amount1Max: position.token1Owed,
				deadline: deadline(),
			})
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e)
		} finally {
			loadingAction = null
		}
	}

	const doRemove = async (position: UniswapPosition) => {
		if (!provider) return
		actionError = null
		loadingAction = position.id
		try {
			await removeLiquidity({
				provider,
				positionId: position.id,
				liquidity: position.liquidity,
				amount0Min: 0n,
				amount1Min: 0n,
				deadline: deadline(),
			})
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e)
		} finally {
			loadingAction = null
		}
	}

	const parseBigInt = (s: string) => {
		try {
			const t = s.trim()
			return t === '' ? 0n : BigInt(t)
		} catch {
			return 0n
		}
	}
	const doIncrease = async (position: UniswapPosition) => {
		if (!provider) return
		const a0 = parseBigInt(increaseAmount0)
		const a1 = parseBigInt(increaseAmount1)
		if (a0 === 0n && a1 === 0n) return
		actionError = null
		loadingAction = position.id
		try {
			await increaseLiquidity({
				provider,
				positionId: position.id,
				amount0Desired: a0,
				amount1Desired: a1,
				amount0Min: 0n,
				amount1Min: 0n,
				deadline: deadline(),
			})
			increasePositionId = null
			increaseAmount0 = '0'
			increaseAmount1 = '0'
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e)
		} finally {
			loadingAction = null
		}
	}
</script>

{#if filtered.length > 0}
	<section data-card data-column="gap-2">
		<h3>Your positions</h3>
		{#if actionError}
			<p data-muted role="alert">{actionError}</p>
		{/if}
		<ul data-column="gap-2" style="list-style: none; padding: 0; margin: 0;">
			{#each filtered as position (position.id)}
				<li data-card data-column="gap-2">
					<div data-row="gap-2 align-center justify-between wrap">
						<span data-muted>Pool {position.poolId.slice(0, 10)}…</span>
						<span>ticks {position.tickLower} – {position.tickUpper}</span>
						<span>Liquidity: {position.liquidity.toString().slice(0, 12)}…</span>
					</div>
					{#if canAct}
						<div data-row="gap-2 align-center wrap">
							<Button.Root
								type="button"
								disabled={loadingAction !== null}
								onclick={() => doCollect(position)}
							>
								Collect
							</Button.Root>
							<Button.Root
								type="button"
								disabled={loadingAction !== null}
								onclick={() => doRemove(position)}
							>
								Remove
							</Button.Root>
							{#if increasePositionId === position.id}
								<input
									type="text"
									placeholder="Amount 0"
									bind:value={increaseAmount0}
									aria-label="Amount 0 to add"
								/>
								<input
									type="text"
									placeholder="Amount 1"
									bind:value={increaseAmount1}
									aria-label="Amount 1 to add"
								/>
								<Button.Root
									type="button"
									disabled={loadingAction !== null}
									onclick={() => doIncrease(position)}
								>
									Add
								</Button.Root>
								<Button.Root
									type="button"
									onclick={() => {
										increasePositionId = null
										increaseAmount0 = '0'
										increaseAmount1 = '0'
									}}
								>
									Cancel
								</Button.Root>
							{:else}
								<Button.Root
									type="button"
									onclick={() => {
										increasePositionId = position.id
										increaseAmount0 = '0'
										increaseAmount1 = '0'
									}}
								>
									Increase
								</Button.Root>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}
