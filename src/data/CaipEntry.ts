/**
 * CAIP entry: normalized metadata from ChainAgnostic/CAIPs repo.
 * Official link: https://chainagnostic.org/CAIPs/caip-{number}
 */

import type { DataSource } from '$/constants/data-sources.ts'

export type CaipEntry$Id = { id: string }

export type CaipEntry = {
	number: number
	title: string
	status: string
	/** Standard, Meta, Informational */
	type: string
	url: string
	$source: DataSource
}
