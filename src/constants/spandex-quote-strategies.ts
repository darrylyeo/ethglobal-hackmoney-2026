import type { QuotePerformance } from '@spandex/core'
import { ProtocolStrategy } from '$/constants/protocols.ts'

export const spandexQuoteStrategies = [
	ProtocolStrategy.BestPrice,
	ProtocolStrategy.Fastest,
	ProtocolStrategy.EstimatedGas,
] as const satisfies readonly Exclude<ProtocolStrategy, ProtocolStrategy.Priority>[]

export const spandexQuoteMetricByStrategy: Record<
	(typeof spandexQuoteStrategies)[number],
	{
		metric: keyof QuotePerformance
		ascending: boolean
	}
> = {
	[ProtocolStrategy.BestPrice]: { metric: 'outputAmount', ascending: false },
	[ProtocolStrategy.Fastest]: { metric: 'latency', ascending: true },
	[ProtocolStrategy.EstimatedGas]: { metric: 'gasUsed', ascending: true },
}
