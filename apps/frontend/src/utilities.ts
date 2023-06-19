/* eslint-disable unicorn/no-array-reduce */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { camelCase, snakeCase } from "change-case";

export type Expand<T> = T extends
	| string
	| number
	| boolean
	| symbol
	| bigint
	| null
	| undefined
	// eslint-disable-next-line @typescript-eslint/ban-types
	| Function
	? T
	: { [P in keyof T]: T[P] };

export type NotOptional<T, K extends keyof T> = Expand<
	Omit<T, K> & {
		[P in K]-?: T[P];
	}
>;

export function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

export type Entries<T> = Array<
	{
		[K in keyof T]: [K, T[K]];
	}[keyof T]
>;

// eslint-disable-next-line @typescript-eslint/ban-types
export function entries<T extends {}>(value: T): Entries<T> {
	return Object.entries(value) as Entries<T>;
}

export type ArrayElement<A> = A extends ReadonlyArray<infer T> ? T : never;
export type DeepWriteable<T> = {
	-readonly [P in keyof T]: DeepWriteable<T[P]>;
};
export type Cast<X, Y> = X extends Y ? X : Y;
export type FromEntries<T> = T extends Array<[infer Key, any]>
	? { [K in Cast<Key, string>]: Extract<ArrayElement<T>, [K, any]>[1] }
	: { [key in string]: any };

export function fromEntries<T extends Array<any>>(
	value: T
): FromEntries<DeepWriteable<T>> {
	return Object.fromEntries(value) as FromEntries<T>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function keys<T extends {}>(value: T): Array<keyof T> {
	return Object.keys(value) as Array<keyof T>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function omit<T extends {}, K extends keyof T>(
	value: T,
	keys: Array<K>
): Omit<T, K> {
	return fromEntries(
		entries(value).filter(([key]) => !keys.includes(key as K))
	) as Omit<T, K>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function pick<T extends {}, K extends keyof T>(
	value: T,
	keys: Array<K>
): Pick<T, K> {
	return fromEntries(
		entries(value).filter(([key]) => keys.includes(key as K))
	) as Pick<T, K>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function pickBy<T extends {}>(
	object: T,
	callback: (key: keyof T, value: T[keyof T], object: T) => boolean
): Partial<T> {
	return fromEntries(
		entries(object).filter(([key, value]) => callback(key, value, object))
	) as Partial<T>;
}

export function transformObject<T>(
	object: any,
	transformer: (key: string, value: any) => any
): T {
	if (Array.isArray(object))
		return object.map((innerObject) => {
			return transformObject(innerObject, transformer);
		}) as T;
	if (typeof object !== "object") return object;
	if (object === null) return null as T;

	return fromEntries(
		entries(object).map(([key, value]) => {
			return transformer(key, transformObject(value, transformer));
		})
	) as T;
}

export function toCamelObject<T>(object: any): T {
	return transformObject(object, (key, value) => {
		return [camelCase(key), toCamelObject(value)];
	});
}

export function toSnakeObject<T>(object: any): T {
	return transformObject(object, (key, value) => [
		snakeCase(key),
		toSnakeObject(value)
	]);
}

export function capitalize<T extends string>(value: T): Capitalize<T> {
	return `${value[0].toUpperCase()}${value.slice(1)}` as Capitalize<T>;
}

export function uncapitalize<T extends string>(value: T): Uncapitalize<T> {
	return `${value[0].toLowerCase()}${value.slice(1)}` as Uncapitalize<T>;
}

export function sortBy<T>(
	array: Array<T>,
	key: keyof T | ((value: T) => string | number),
	direction: 1 | -1 = -1
): Array<T> {
	const valueFunction =
		typeof key === "function" ? key : (value: T) => value[key];

	return [...array].sort((a, b) => {
		const aValue = valueFunction(a),
			bValue = valueFunction(b);

		if (aValue || bValue) return aValue < bValue ? direction : -direction;
		return 0;
	});
}

export function filterBy<T, K extends keyof T>(
	array: Array<T>,
	key: K,
	value: T[K]
): Array<T> {
	return array.filter((arrayValue) => arrayValue[key] === value);
}

export function excludeBy<T, K extends keyof T>(
	array: Array<T>,
	key: K,
	value: T[K]
): Array<T>;
export function excludeBy<T, K extends keyof T>(
	array: Array<T>,
	key: K,
	values: Array<T[K]>
): Array<T>;
export function excludeBy<T, K extends keyof T>(
	array: Array<T>,
	key: K,
	value: T[K] | Array<T[K]>
): Array<T> {
	return array.filter((arrayValue) =>
		Array.isArray(value)
			? !value.includes(arrayValue[key])
			: arrayValue[key] !== value
	);
}

export function findBy<T, K extends keyof T>(
	array: Array<T>,
	key: K,
	value: T[K]
): T | undefined {
	return array.find((arrayValue) => arrayValue[key] === value);
}

export function someBy<T, K extends keyof T>(
	array: Array<T>,
	key: K,
	value: T[K]
): boolean {
	return array.some((arrayValue) => arrayValue[key] === value);
}

export type GroupBy<T extends ReadonlyArray<unknown>, K extends PropertyKey> = {
	[_ in K]: T;
};

export function groupBy<T extends ReadonlyArray<object>, K extends PropertyKey>(
	array: T,
	// eslint-disable-next-line unicorn/prevent-abbreviations
	fn: (value: T[number]) => K
): GroupBy<T, K> {
	return array.reduce((previous: any, current) => {
		const key = fn(current);
		const group = previous[key] || [];
		group.push(current);
		return { ...previous, [key]: group };
	}, {}) as GroupBy<T, K>;
}

export function isUid(value: string): boolean {
	return isShortUuid(value) || isUuid(value);
}

export function isShortUuid(value: string): boolean {
	return value.length === 22;
}

export function isUuid(value: string): boolean {
	return /^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
		value
	);
}

export function tryJsonParse<T>(value: string, fallbackValue: T): T {
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallbackValue;
	}
}

export function hashCode(value: string): number {
	let hash = 0;
	const length = value.length;

	for (let index = 0; index < length; index++) {
		hash = (hash << 5) - hash + (value.codePointAt(index) || 1);
		hash = Math.trunc(hash);
	}

	return hash;
}

export function tinySimpleHash(value: string): number {
	let h = 9;

	for (let index = 0; index < value.length; ) {
		h = Math.imul(h ^ (value.codePointAt(index++) || 1), 9 ** 9);
	}

	return h ^ (h >>> 9);
}

export const noop = () => void 0;
