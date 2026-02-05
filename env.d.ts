interface ObjectConstructor {
	keys<T extends Record<PropertyKey, unknown>>(obj: T): Array<keyof T>

	values<T extends Record<PropertyKey, unknown>>(obj: T): Array<T[keyof T]>

	entries<T extends Record<PropertyKey, unknown>>(
		obj: T,
	): Array<{ [K in keyof T]: [K, T[K]] }[keyof T]>

	fromEntries<K extends PropertyKey, V>(
		entries: ReadonlyArray<readonly [K, V]>,
	): Record<K, V>
}

interface Array<T> {
	filter<S extends Exclude<T, undefined>>(
		predicate: (value: T, index: number, array: T[]) => value is S,
		thisArg?: unknown,
	): S[]
}

interface ImportMetaEnv {
	readonly PUBLIC_EXPLAIN_LLM_ENDPOINT?: string
	readonly PUBLIC_EXPLAIN_LLM_API_KEY?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
