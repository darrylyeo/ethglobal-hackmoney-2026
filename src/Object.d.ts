interface ObjectConstructor {
	keys<T extends Record<PropertyKey, unknown>>(obj: T): Array<keyof T>

	values<T extends Record<PropertyKey, unknown>>(obj: T): Array<T[keyof T]>

	entries<T extends Record<PropertyKey, unknown>>(
		obj: T,
	): Array<{ [K in keyof T]: [K, T[K]] }[keyof T]>

	fromEntries<K extends PropertyKey, V>(entries: ReadonlyArray<readonly [K, V]>): Record<K, V>
}
