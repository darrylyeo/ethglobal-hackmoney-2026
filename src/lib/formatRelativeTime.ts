export const formatRelativeTime = (ms: number) => {
	if (!Number.isFinite(ms) || Math.abs(ms) < 1000) {
		return 'now'
	}
	const rtf = new Intl.RelativeTimeFormat('en', {
		numeric: 'always',
		style: 'narrow',
	})

	const absMs = Math.abs(ms)
	const seconds = Math.floor(absMs / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)
	const weeks = Math.floor(days / 7)
	const months = Math.floor(days / 30)
	const years = Math.floor(days / 365)

	const value = ms < 0 ? 1 : -1

	const format = (val: number, unit: Intl.RelativeTimeFormatUnit) =>
		rtf.format(val, unit)

	const dedupe = (s: string) =>
		ms < 0 ?
			s.replace(/\s+in\s+/g, ' ')
		:
			s.replace(/\s+ago\s+/g, ' ')

	if (years > 0) {
		const remainingMonths = months % 12
		if (remainingMonths > 0) {
			return dedupe(`${format(value * years, 'year')} ${format(value * remainingMonths, 'month')}`)
		}
		return format(value * years, 'year')
	}
	if (months > 0) {
		const remainingDays = days % 30
		if (remainingDays > 0) {
			return dedupe(`${format(value * months, 'month')} ${format(value * remainingDays, 'day')}`)
		}
		return format(value * months, 'month')
	}
	if (weeks > 0) {
		const remainingDays = days % 7
		if (remainingDays > 0) {
			return dedupe(`${format(value * weeks, 'week')} ${format(value * remainingDays, 'day')}`)
		}
		return format(value * weeks, 'week')
	}
	if (days > 0) {
		const remainingHours = hours % 24
		if (remainingHours > 0) {
			return dedupe(`${format(value * days, 'day')} ${format(value * remainingHours, 'hour')}`)
		}
		return format(value * days, 'day')
	}
	if (hours > 0) {
		const remainingMinutes = minutes % 60
		if (remainingMinutes > 0) {
			return dedupe(`${format(value * hours, 'hour')} ${format(value * remainingMinutes, 'minute')}`)
		}
		return format(value * hours, 'hour')
	}
	if (minutes > 0) {
		const remainingSeconds = seconds % 60
		if (remainingSeconds > 0) {
			return dedupe(`${format(value * minutes, 'minute')} ${format(value * remainingSeconds, 'second')}`)
		}
		return format(value * minutes, 'minute')
	}
	return format(value * seconds, 'second')
}
