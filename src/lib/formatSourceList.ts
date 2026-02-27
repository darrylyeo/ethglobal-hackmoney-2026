import { DataSourceId, dataSourcesById } from '$/constants/data-sources.ts'

export const formatSourceList = (sources: readonly DataSourceId[]) =>
	(
		new Intl.ListFormat('en', { type: 'unit', style: 'long' })
			.format(sources.map((s) => dataSourcesById[s].label))
	)
