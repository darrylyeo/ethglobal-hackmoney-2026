interface ObjectConstructor {
	keys<T extends Record<PropertyKey, unknown>>(obj: T): (keyof T)[]

	values<T extends Record<PropertyKey, unknown>>(obj: T): (T[keyof T])[]

	entries<T extends Record<PropertyKey, unknown>>(
		obj: T,
	): ({ [K in keyof T]: [K, T[K]] }[keyof T])[]

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
	readonly PUBLIC_TEVM_RPC_URL?: string
	readonly PUBLIC_LLM_API_KEY?: string
	readonly PUBLIC_LLM_ENDPOINT?: string
	readonly PUBLIC_PARTYKIT_HOST?: string
	readonly PUBLIC_STORK_REST_TOKEN?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
