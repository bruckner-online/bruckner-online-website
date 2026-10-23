type MaybeArray<T> = Array<T> | T;

export function ensureArray<T>(values: MaybeArray<T>): Array<T> {
	if (Array.isArray(values)) {
		return values;
	}
	return [values];
}
