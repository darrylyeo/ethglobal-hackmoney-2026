import type { ChainId } from '$/constants/networks'
import type { YellowResource } from '$/constants/yellow/resources'

export type YellowResourceEntry = {
	chainId: ChainId
	resource: YellowResource
	value: string
}
