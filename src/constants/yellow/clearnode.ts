/**
 * Yellow clearnode endpoints.
 */

import {
	YellowResource,
	yellowResourcesByType,
} from '$/constants/yellow/resources'

export const CLEARNODE_WS_URL =
	yellowResourcesByType[YellowResource.ClearnodeWsUrl]
export const CLEARNODE_WS_URL_SANDBOX = 'wss://clearnet-sandbox.yellow.com/ws'
