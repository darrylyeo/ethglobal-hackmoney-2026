import { getBoxToBoxArrow } from 'perfect-arrows'

export type ArrowData = [
	sx: number, sy: number,
	cx: number, cy: number,
	ex: number, ey: number,
	ae: number, as_: number, ac: number,
]

export const computeArrow = (
	sourceRect: { left: number; top: number; width: number; height: number },
	targetRect: { left: number; top: number; width: number; height: number },
	options?: { padStart?: number; padEnd?: number },
) => (
	getBoxToBoxArrow(
		sourceRect.left, sourceRect.top, sourceRect.width, sourceRect.height,
		targetRect.left, targetRect.top, targetRect.width, targetRect.height,
		{ padStart: options?.padStart ?? 8, padEnd: options?.padEnd ?? 12 },
	) as ArrowData
)

export const arrowToPathD = (arrow: ArrowData) => (
	`M ${arrow[0]} ${arrow[1]} Q ${arrow[2]} ${arrow[3]} ${arrow[4]} ${arrow[5]}`
)

export const arrowMidPoint = (arrow: ArrowData) => ({
	x: 0.25 * arrow[0] + 0.5 * arrow[2] + 0.25 * arrow[4],
	y: 0.25 * arrow[1] + 0.5 * arrow[3] + 0.25 * arrow[5],
})

export const FLOW_ICON_COUNT = 4
export const FLOW_DURATION_S = 1.8
