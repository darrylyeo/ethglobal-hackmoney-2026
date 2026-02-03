import type { MediaType } from '$/constants/media'

export type Media = {
	type: MediaType
	original?: MediaObject
	thumbnail?: MediaObject
	low?: MediaObject
	medium?: MediaObject
	high?: MediaObject
	hash?: string
}

export type MediaObject = {
	url: string
	width?: number
	height?: number
	mimeType?: string
	size?: number
}
