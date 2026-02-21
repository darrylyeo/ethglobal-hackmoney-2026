import type { ChainForkSchedule, ForkActivation } from '$/data/fork-schedules/types.ts'
import schedulesData from './schedules.json'

const schedules = schedulesData as { chains: Record<string, ChainForkSchedule> }

export type EraAtBlock = {
	eraId: string
	label: string
	startBlock?: number
	endBlock?: number
}

export function getEraAtBlock(
	chainId: number,
	blockNumber: number,
): EraAtBlock | null {
	const chain = schedules.chains[String(chainId)]
	if (!chain) return null
	const blockForks = chain.forks.filter(
		(f: ForkActivation) => f.activation.block !== undefined,
	) as (ForkActivation & { activation: { block: number } })[]
	if (blockForks.length === 0) return null
	const sorted = [...blockForks].sort(
		(a, b) => a.activation.block - b.activation.block,
	)
	let last: (typeof sorted)[0] | null = null
	for (const f of sorted) {
		if (f.activation.block <= blockNumber) last = f
		else break
	}
	if (!last) {
		const first = sorted[0]
		return {
			eraId: 'Genesis',
			label: 'Genesis',
			startBlock: 0,
			endBlock: first.activation.block - 1,
		}
	}
	const idx = sorted.indexOf(last)
	const next = sorted[idx + 1]
	return {
		eraId: last.name,
		label: last.name,
		startBlock: last.activation.block,
		endBlock: next?.activation.block != null ? next.activation.block - 1 : undefined,
	}
}

export function hasForkSchedule(chainId: number): boolean {
	return schedules.chains[String(chainId)] != null
}
