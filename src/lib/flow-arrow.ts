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

const quadraticBezierLength = (
	sx: number,
	sy: number,
	cx: number,
	cy: number,
	ex: number,
	ey: number,
) => {
	const n = 24
	let len = 0
	let px = sx
	let py = sy
	for (let i = 1; i <= n; i++) {
		const t = i / n
		const t1 = 1 - t
		const x = t1 * t1 * sx + 2 * t1 * t * cx + t * t * ex
		const y = t1 * t1 * sy + 2 * t1 * t * cy + t * t * ey
		len += Math.hypot(x - px, y - py)
		px = x
		py = y
	}
	return len
}

export const arrowPathLength = (arrow: ArrowData) => (
	quadraticBezierLength(arrow[0], arrow[1], arrow[2], arrow[3], arrow[4], arrow[5])
)

export const arrowMidPoint = (arrow: ArrowData) => ({
	x: 0.25 * arrow[0] + 0.5 * arrow[2] + 0.25 * arrow[4],
	y: 0.25 * arrow[1] + 0.5 * arrow[3] + 0.25 * arrow[5],
})

export const arrowTooltipAnchor = (arrow: ArrowData, offset: number) => {
	const mid = arrowMidPoint(arrow)
	const cx = arrow[2]
	const cy = arrow[3]
	const dx = cx - mid.x
	const dy = cy - mid.y
	const len = Math.hypot(dx, dy)
	const k = len > 0 ? offset / len : 0
	return { x: mid.x + dx * k, y: mid.y + dy * k }
}

export const FLOW_ICON_COUNT = 4
export const FLOW_SPEED_PX_S = 120
export const FLOW_MIN_DURATION_S = 0.4
