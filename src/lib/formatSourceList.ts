import { DataSourceId, dataSourcesById } from '$/constants/data-sources.ts'

const listFormat = new Intl.ListFormat('en', { type: 'unit', style: 'long' })

export const formatSourceList = (sources: readonly DataSourceId[]): string =>
	listFormat.format(sources.map((s) => dataSourcesById[s].label))
