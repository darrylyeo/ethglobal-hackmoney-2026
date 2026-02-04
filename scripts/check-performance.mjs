import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const reportPath = path.join(process.cwd(), '.tmp-lh-report.json')

const FCP_MS = 1500
const LCP_MS = 2500
const CLS_MAX = 0.1
const TBT_MS = 300

function isUrl(s) {
	return (
		typeof s === 'string' &&
		(s.startsWith('http://') || s.startsWith('https://'))
	)
}

function runLighthouse(baseUrl) {
	const url = baseUrl.endsWith('/bridge')
		? baseUrl
		: `${baseUrl.replace(/\/$/, '')}/bridge`
	try {
		execSync(
			`deno run -A npm:lighthouse "${url}" --output=json --output-path="${reportPath}" --only-categories=performance --form-factor=mobile --chrome-flags="--headless --no-sandbox --disable-gpu"`,
			{ stdio: 'inherit', maxBuffer: 10 * 1024 * 1024 },
		)
		return true
	} catch (e) {
		const out = String(e.stderr ?? e.stdout ?? e.message ?? '')
		if (/Chrome|chromium|not found/i.test(out)) {
			console.warn(
				'Skipping Lighthouse (Chrome not available). Pass a pre-generated report path to verify.',
			)
			return false
		}
		process.exit(1)
	}
}

function checkReport(report) {
	const audits = report.audits ?? {}
	const fcp = audits['first-contentful-paint']?.numericValue ?? Infinity
	const lcp = audits['largest-contentful-paint']?.numericValue ?? Infinity
	const cls = audits['cumulative-layout-shift']?.numericValue ?? Infinity
	const tbt = audits['total-blocking-time']?.numericValue ?? Infinity

	const ok = fcp <= FCP_MS && lcp <= LCP_MS && cls <= CLS_MAX && tbt <= TBT_MS
	console.log(`FCP: ${fcp}ms (≤${FCP_MS}) ${fcp <= FCP_MS ? '✓' : '✗'}`)
	console.log(`LCP: ${lcp}ms (≤${LCP_MS}) ${lcp <= LCP_MS ? '✓' : '✗'}`)
	console.log(`CLS: ${cls} (≤${CLS_MAX}) ${cls <= CLS_MAX ? '✓' : '✗'}`)
	console.log(`TBT: ${tbt}ms (≤${TBT_MS}) ${tbt <= TBT_MS ? '✓' : '✗'}`)
	return ok
}

const input = process.argv[2] ?? process.env.BASE_URL ?? 'http://localhost:4173'

if (isUrl(input)) {
	if (!runLighthouse(input)) process.exit(0)
}

const reportFile = isUrl(input)
	? reportPath
	: path.resolve(process.cwd(), input)
if (!fs.existsSync(reportFile)) {
	console.error(
		'No report found. Run with BASE_URL or pass path to Lighthouse JSON report.',
	)
	process.exit(1)
}

const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'))
if (isUrl(input)) {
	try {
		fs.unlinkSync(reportPath)
	} catch {}
}

const pass = checkReport(report)
process.exit(pass ? 0 : 1)
