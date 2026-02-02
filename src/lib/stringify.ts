export const stringify: typeof JSON.stringify = (value, replacer, space) =>
	JSON.stringify(
		value,
		(key, val) =>
			typeof val === 'bigint'
				? val.toString()
				: typeof replacer === 'function'
					? replacer.call(value, key, val)
					: val,
		space,
	)
